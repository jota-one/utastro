export const prerender = false;

import type { APIRoute } from "astro";
import config from "@/config";
import { sendEmail } from "@/utils/email";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const message = (formData.get("message") as string)?.trim() || "";
    const captchaToken = (formData.get("captchaToken") as string) || "";
    const files = formData.getAll("files") as File[];

    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: "required_fields_missing" }),
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
      });
    }

    if (config.hcaptcha.enabled) {
      const captchaRes = await fetch("https://api.hcaptcha.com/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: config.hcaptcha.secret,
          response: captchaToken,
        }),
      });
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        return new Response(JSON.stringify({ error: "invalid_captcha" }), {
          status: 400,
        });
      }
    }

    const attachments = await Promise.all(
      files
        .filter((f) => f.size > 0)
        .map(async (file) => {
          const buffer = await file.arrayBuffer();
          return {
            name: file.name,
            content: Buffer.from(buffer).toString("base64"),
            type: file.type || "application/octet-stream",
          };
        }),
    );

    const htmlBody = `
      <h2>Candidature coach — Urban Training</h2>
      <p><b>Prénom :</b> ${firstName}</p>
      <p><b>Nom :</b> ${lastName}</p>
      <p><b>Email :</b> <a href="mailto:${email}">${email}</a></p>
      ${message ? `<p><b>Message :</b></p><p>${message.replace(/\n/g, "<br>")}</p>` : ""}
    `;

    await sendEmail({
      subject: "Message du site — page Job coach",
      htmlBody,
      to: { email: config.webmasterEmail, name: "Urban Training" },
      attachments,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("[coaches API]", err);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
    });
  }
};
