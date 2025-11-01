'use client';

export interface TextSelectionInfo {
  text: string;
  position: { x: number; y: number };
  range: Range;
  element: Element;
}

export interface OrbPosition {
  x: number;
  y: number;
}

class OrbPositioningService {
  private listeners: ((selection: TextSelectionInfo | null) => void)[] = [];
  private currentSelection: TextSelectionInfo | null = null;
  private orbElement: HTMLElement | null = null;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;
    
    // Listen for text selection changes
    document.addEventListener('selectionchange', this.handleSelectionChange);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keyup', this.handleKeyUp);
    
    this.isInitialized = true;
  }

  cleanup() {
    document.removeEventListener('selectionchange', this.handleSelectionChange);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.isInitialized = false;
  }

  setOrbElement(element: HTMLElement) {
    this.orbElement = element;
  }

  private handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.currentSelection = null;
      this.notifyListeners(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    
    if (text.length === 0) {
      this.currentSelection = null;
      this.notifyListeners(null);
      return;
    }

    // Get the position at the end of the selection
    const rect = range.getBoundingClientRect();
    const endPosition = this.getSelectionEndPosition(range);
    
    const selectionInfo: TextSelectionInfo = {
      text,
      position: endPosition,
      range,
      element: range.commonAncestorContainer.parentElement || document.body
    };

    this.currentSelection = selectionInfo;
    this.notifyListeners(selectionInfo);
  };

  private handleMouseUp = () => {
    // Small delay to ensure selection is finalized
    setTimeout(() => {
      if (this.currentSelection) {
        this.repositionOrb(this.currentSelection);
      }
    }, 100);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    // Handle keyboard text selection (Shift + Arrow keys, etc.)
    if (e.shiftKey || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      setTimeout(() => {
        if (this.currentSelection) {
          this.repositionOrb(this.currentSelection);
        }
      }, 100);
    }
  };

  private getSelectionEndPosition(range: Range): { x: number; y: number } {
    // Create a temporary element at the end of the selection
    const tempElement = document.createElement('span');
    tempElement.style.position = 'absolute';
    tempElement.style.visibility = 'hidden';
    tempElement.style.pointerEvents = 'none';
    
    // Clone the range and collapse it to the end
    const endRange = range.cloneRange();
    endRange.collapse(false); // Collapse to end
    
    try {
      endRange.insertNode(tempElement);
      const rect = tempElement.getBoundingClientRect();
      const position = {
        x: rect.right + 10, // Add some offset
        y: rect.top + (rect.height / 2)
      };
      
      // Clean up
      tempElement.remove();
      
      return position;
    } catch (error) {
      // Fallback to range bounding rect
      const rect = range.getBoundingClientRect();
      return {
        x: rect.right + 10,
        y: rect.top + (rect.height / 2)
      };
    }
  }

  private repositionOrb(selection: TextSelectionInfo) {
    if (!this.orbElement) return;

    const { x, y } = selection.position;
    
    // Calculate optimal position for the orb
    const orbSize = 60; // Approximate orb size
    const margin = 20;
    
    // Ensure orb stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let orbX = Math.min(x, viewportWidth - orbSize - margin);
    let orbY = Math.min(y - (orbSize / 2), viewportHeight - orbSize - margin);
    
    // Ensure minimum distances from edges
    orbX = Math.max(margin, orbX);
    orbY = Math.max(margin, orbY);
    
    // Apply smooth transition
    this.orbElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.orbElement.style.left = `${orbX}px`;
    this.orbElement.style.top = `${orbY}px`;
    this.orbElement.style.right = 'auto';
    this.orbElement.style.bottom = 'auto';
    
    // Reset transition after animation
    setTimeout(() => {
      if (this.orbElement) {
        this.orbElement.style.transition = '';
      }
    }, 300);
  }

  resetOrbPosition() {
    if (!this.orbElement) return;
    
    // Reset to default bottom-right position
    this.orbElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this.orbElement.style.left = 'auto';
    this.orbElement.style.top = 'auto';
    this.orbElement.style.right = '1rem';
    this.orbElement.style.bottom = '1rem';
    
    setTimeout(() => {
      if (this.orbElement) {
        this.orbElement.style.transition = '';
      }
    }, 300);
  }

  onSelectionChange(callback: (selection: TextSelectionInfo | null) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(selection: TextSelectionInfo | null) {
    this.listeners.forEach(listener => listener(selection));
  }

  getCurrentSelection(): TextSelectionInfo | null {
    return this.currentSelection;
  }

  clearSelection() {
    if (window.getSelection) {
      window.getSelection()?.removeAllRanges();
    }
    this.currentSelection = null;
    this.notifyListeners(null);
    this.resetOrbPosition();
  }
}

export const orbPositioningService = new OrbPositioningService();