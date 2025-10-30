
import { LandingHeader } from "@/components/layout/LandingHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <LandingHeader />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Card className="frosted-glass p-6 md:p-10">
          <CardHeader>
            <CardTitle className="text-3xl md:text-4xl font-bold font-headline text-primary">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none text-foreground/80">
            <p>Calendar.ai ("us", "we", or "our") operates the Calendar.ai application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>

            <h3>1. Information Collection and Use</h3>
            <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
            <h4>Types of Data Collected:</h4>
            <ul>
              <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This includes, but is not limited to: Email address, First name and last name, Payment information (processed via Razorpay, not stored by us), and Usernames for third-party services (e.g., Codeforces, LeetCode) that you voluntarily provide.</li>
              <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g., IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.</li>
              <li><strong>Data from Third-Party Services:</strong> With your explicit consent via OAuth, we may access data from third-party services such as Google (Calendar, Tasks, Gmail) and Microsoft (Outlook). The data we access is strictly limited to what is necessary to provide the Service features, such as displaying your events, tasks, and summarizing emails. We only store metadata (like event IDs) required to link and sync content; we do not permanently store the body of your emails or calendar event details from these services on our servers.</li>
            </ul>
            
            <h3>2. Use of Data</h3>
            <p>Calendar.ai uses the collected data for various purposes:</p>
            <ul>
              <li>To provide and maintain our Service.</li>
              <li>To manage your account and subscription.</li>
              <li>To provide you with personalized features, such as AI-generated daily plans and career roadmaps.</li>
              <li>To process data you provide to our AI features. For example, text you enter for career vision planning is sent to Google's Gemini models for processing.</li>
              <li>To provide customer support.</li>
              <li>To gather analysis or valuable information so that we can improve our Service.</li>
              <li>To monitor the usage of our Service.</li>
            </ul>

            <h3>3. Data Storage and Security</h3>
            <ul>
                <li>Your core account data, including your profile information, goals, skills, and timeline events created within our app, is stored securely in our Firestore database, hosted by Google Cloud.</li>
                <li>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</li>
                <li>AI data processing, such as email summarization, is performed in a privacy-conscious manner. We have implemented filters to automatically ignore and not process emails containing sensitive keywords like "password," "OTP," "verification code," or "security alert."</li>
            </ul>

            <h3>4. Your Data Rights</h3>
            <p>You have certain data protection rights. Calendar.ai aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.</p>
            <ul>
              <li><strong>Access, Update, or Delete:</strong> You can access, update, or request deletion of your Personal Data directly within your account settings section. We provide features to export all your data or permanently delete your account.</li>
              <li><strong>Data Portability:</strong> You have the right to be provided with a copy of the information we have on you in a structured, machine-readable, and commonly used format (JSON), which you can do via the "Export My Data" feature.</li>
            </ul>

            <h3>5. Service Providers</h3>
            <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.</p>
            <ul>
                <li><strong>Google (Firebase & Google Cloud):</strong> For database, authentication, and hosting.</li>
                <li><strong>Google AI (Gemini):</strong> For processing AI-related feature requests.</li>
                <li><strong>Razorpay:</strong> For processing subscription payments. We do not store or have access to your full credit card information.</li>
            </ul>
            <p>These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>

            <h3>6. Children's Privacy</h3>
            <p>Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.</p>

            <h3>7. Changes to This Privacy Policy</h3>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h3>8. Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:ashishyesale007@gmail.com">ashishyesale007@gmail.com</a>.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
