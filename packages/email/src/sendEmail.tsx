import { render } from "@react-email/render";
import nodemailer from "nodemailer";

import JoinWorkspaceTemplate from "./templates/join-workspace";
import MagicLinkTemplate from "./templates/magic-link";

type Templates = "MAGIC_LINK" | "JOIN_WORKSPACE";

const emailTemplates: Record<Templates, React.FC> = {
  MAGIC_LINK: MagicLinkTemplate,
  JOIN_WORKSPACE: JoinWorkspaceTemplate,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  template: Templates,
  data: Record<string, string>,
) => {
  const EmailTemplate = emailTemplates[template];

  const html = await render(<EmailTemplate {...data} />, { pretty: true });

  const options = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  const response = await transporter.sendMail(options);

  if (!response.accepted.length) {
    throw new Error(`Failed to send email: ${response.response}`);
  }

  return response;
};
