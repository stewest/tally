import { inviteUserTemplate } from "@/emails/templates/emailTemplates";
import { Client } from "postmark";

interface EmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

interface InviteUserEmailParams {
  name?: string;
  email: string;
  token: string;
  organisationName?: string;
  inviterName?: string;
}

class EmailService {
  private postmarkServerToken: string;
  private fromEmail: string;
  private client: Client;

  constructor() {
    this.postmarkServerToken =
      process.env.POSTMARK_SERVER_TOKEN || "an_invalid_token";
    this.fromEmail = process.env.FROM_EMAIL || "noreply@yourdomain.com";
    this.client = new Client(this.postmarkServerToken);

    if (!this.postmarkServerToken) {
      console.warn("POSTMARK_SERVER_TOKEN not found in environment variables");
    }
  }

  private async sendEmail({ to, subject, htmlBody, textBody }: EmailParams) {
    if (!this.postmarkServerToken) {
      console.error("Postmark API key not configured");
      throw new Error(
        "Email service not configured - missing POSTMARK_SERVER_TOKEN"
      );
    }

    try {
      const response = await this.client.sendEmail({
        From: this.fromEmail,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: "outbound",
      });

      console.log("Email sent successfully");
      console.log("To:", response.To);
      console.log("Message:", response.Message);
      console.log("MessageID:", response.MessageID);

      return response;
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  async inviteUser({ email, token, organisationName }: InviteUserEmailParams) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${origin}/accept-invite?token=${token}`;

    const variables = {
      organisationName: organisationName || "the organization",
      inviteUrl,
      siteName: process.env.NEXT_PUBLIC_APP_NAME || "TALLY",
    };

    const htmlBody = inviteUserTemplate(variables);

    const textBody = `
Hi there,

You've been invited to join ${variables.organisationName}!

Click the link below to accept your invitation:
${inviteUrl}

If you don't have an account yet, you'll be able to create one during the process.

Best regards,
The team
    `.trim();

    await this.sendEmail({
      to: email,
      subject: `You're invited to join ${variables.organisationName}`,
      htmlBody,
      textBody,
    });

    console.log(
      `Invitation email sent to ${email} for organization: ${organisationName}`
    );
    return { success: true, inviteUrl };
  }
}

export const emailService = new EmailService();
