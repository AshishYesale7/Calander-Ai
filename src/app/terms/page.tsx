
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfServicePage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <LandingHeader />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="frosted-glass p-6 md:p-10">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold font-headline text-primary">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none text-foreground/80">
            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Calendar.ai website and web application (the "Service") operated by Calendar.ai ("us", "we", or "our").</p>

            <h3>1. Acceptance of Terms</h3>
            <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. This Agreement applies to all visitors, users, and others who access or use the Service.</p>

            <h3>2. Subscriptions and Payments</h3>
            <ul>
              <li><strong>Billing:</strong> Our Service is billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the subscription plan you select when purchasing a Subscription.</li>
              <li><strong>Auto-Renewal:</strong> At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or we cancel it. You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team.</li>
              <li><strong>Payment Method:</strong> A valid payment method is required to process the payment for your Subscription. We use a third-party payment processor, Razorpay, to handle all payment transactions. We do not store your credit card details.</li>
              <li><strong>Free Trial:</strong> We offer a 30-day free trial to new users. At the end of the trial period, you will be required to provide a payment method to continue using the paid features of the Service.</li>
            </ul>

            <h3>3. Accounts</h3>
            <ul>
              <li>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</li>
              <li>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</li>
              <li>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            </ul>

            <h3>4. Third-Party Integrations (Google, Microsoft, etc.)</h3>
            <ul>
              <li>Our Service allows you to connect to third-party services like Google (Calendar, Tasks, Gmail) and Microsoft (Outlook). When you connect these services, you grant us permission to access your data from those services as described in our Privacy Policy and authorized by you during the connection process.</li>
              <li>We are not responsible for the data, policies, or practices of any third-party services, and you are responsible for your compliance with their respective terms of service.</li>
              <li>The availability and functionality of features that rely on these integrations are dependent on the APIs provided by these third parties. We are not liable for any loss of functionality due to changes or issues with third-party APIs.</li>
            </ul>
            
            <h3>5. AI-Generated Content</h3>
            <ul>
                <li>Our Service utilizes artificial intelligence (AI) models to generate content such as daily plans, career roadmaps, and email summaries.</li>
                <li>You acknowledge that AI-generated content may contain inaccuracies or errors. We do not guarantee the accuracy, completeness, or reliability of any information provided by the AI.</li>
                <li>You are solely responsible for reviewing and verifying any AI-generated content before relying on it. You agree to use AI-generated content at your own risk.</li>
            </ul>

            <h3>6. Intellectual Property</h3>
            <p>The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of Calendar.ai. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>

            <h3>7. Termination</h3>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h3>8. Limitation of Liability</h3>
            <p>In no event shall Calendar.ai, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.</p>
            <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>

            <h3>9. Governing Law</h3>
            <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>

            <h3>10. Changes to Terms</h3>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

            <h3>11. Contact Us</h3>
            <p>If you have any questions about these Terms, please contact us at: <a href="mailto:ashishyesale007@gmail.com">ashishyesale007@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
