
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LegalModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const LegalModalContent = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
        <h3 className="font-bold text-lg text-primary">{title}</h3>
        <div className="text-sm text-foreground/80 space-y-4 prose prose-sm dark:prose-invert max-w-none">
            {children}
        </div>
    </div>
);

export default function LegalModal({ isOpen, onOpenChange }: LegalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl frosted-glass flex flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">Legal Information</DialogTitle>
          <DialogDescription>
            Our policies regarding your use of our service.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
            <Tabs defaultValue="terms" className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                    <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
                    <TabsTrigger value="refund">Cancellation & Refund</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping & Delivery</TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1 mt-4">
                    <div className="p-4">
                        <TabsContent value="terms">
                            <LegalModalContent title="Terms and Conditions">
                                <p><strong>Last updated: {new Date().toLocaleDateString()}</strong></p>
                                <p>Please read these terms and conditions carefully before using Our Service.</p>
                                
                                <p><strong>1. Acceptance of Terms:</strong> By accessing and using Calendar.ai ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>

                                <p><strong>2. Subscription:</strong> Our Service is billed on a subscription basis. You will be billed in advance on a recurring, periodic basis (such as monthly or annually), depending on the subscription plan you select. Your Subscription will automatically renew at the end of each billing cycle unless you cancel it.</p>

                                <p><strong>3. User Accounts:</strong> When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

                                <p><strong>4. Intellectual Property:</strong> The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Calendar.ai and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries.</p>
                                
                                <p><strong>5. Limitation of Liability:</strong> In no event shall Calendar.ai, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

                                <p><strong>6. Governing Law:</strong> These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.</p>
                                
                                <p><strong>Contact Us:</strong> If you have any questions about these Terms, please contact us at hyper4stream@gmail.com.</p>

                                <p><em></em></p>
                            </LegalModalContent>
                        </TabsContent>
                        <TabsContent value="privacy">
                            <LegalModalContent title="Privacy Policy">
                                <p><strong>Last updated: {new Date().toLocaleDateString()}</strong></p>
                                <p>Calendar.ai ("us", "we", or "our") operates the Calendar.ai application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.</p>

                                <p><strong>1. Information Collection and Use:</strong> We collect several different types of information for various purposes to provide and improve our Service to you. This includes your email, name (as provided during signup), and data you voluntarily enter into the application such as career goals, skills, and timeline events.</p>

                                <p><strong>2. Use of Data:</strong> Calendar.ai uses the collected data for various purposes: to provide and maintain the Service; to notify you about changes to our Service; to provide customer care and support; to provide analysis or valuable information so that we can improve the Service.</p>

                                <p><strong>3. Data Storage and Security:</strong> Your data is stored securely using Firebase's Firestore database. We take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy. The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
                                
                                <p><strong>4. User Rights:</strong> You have the right to access, update or to delete the information we have on you. You can do this at any time by accessing your account settings or by contacting us.</p>

                                <p><strong>Contact Us:</strong> If you have any questions about this Privacy Policy, please contact us at hyper4stream@gmail.com.</p>

                                <p><em>  </em></p>
                            </LegalModalContent>
                        </TabsContent>
                        <TabsContent value="refund">
                             <LegalModalContent title="Cancellation & Refund Policy">
                                <p><strong>Last updated: {new Date().toLocaleDateString()}</strong></p>
                                <p>This policy outlines the terms for cancellation and refunds for subscriptions to the Calendar.ai service.</p>

                                <p><strong>1. Subscription Cancellation:</strong> You can cancel your subscription at any time through your account settings. The cancellation will take effect at the end of your current billing cycle. You will continue to have access to the Service until the end of the billing period.</p>
                                
                                <p><strong>2. Refund Policy:</strong> We offer a refund for the first 14 days of your initial subscription. If you are not satisfied with the Service for any reason, please contact us within 14 days of your first payment to request a full refund.</p>

                                <p><strong>3. No Refunds for Renewals:</strong> We do not offer refunds for subscription renewals. It is your responsibility to cancel your subscription before the renewal date if you do not wish to continue using the service. We will send a reminder email before your subscription renews.</p>

                                <p><strong>4. How to Request a Refund:</strong> To request a refund, please contact our support team at hyper4stream@gmail.com with your account details and the reason for your request.</p>

                                <p><em></em></p>
                            </LegalModalContent>
                        </TabsContent>
                         <TabsContent value="shipping">
                             <LegalModalContent title="Shipping & Delivery Policy">
                                 <p><strong>Last updated: {new Date().toLocaleDateString()}</strong></p>
                                 <p>This policy explains how our digital services are delivered.</p>

                                <p><strong>1. Nature of Service:</strong> Calendar.ai is a fully digital Software-as-a-Service (SaaS) application. We do not sell or ship any physical goods or products.</p>

                                <p><strong>2. Service Delivery:</strong> Upon successful payment and subscription activation, you will receive immediate access to our application. Access is provided via your user account, which you can log into from our website.</p>
                                
                                <p><strong>3. No Shipping:</strong> As our product is digital, there are no shipping fees, delivery times, or physical items involved. All services are accessible online through your web browser.</p>

                                <p>If you have any questions regarding your access to the service, please contact us at hyper4stream@gmail.com.</p>
                            </LegalModalContent>
                        </TabsContent>
                    </div>
                </ScrollArea>
            </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
