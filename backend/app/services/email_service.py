import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def _send_email(to: str, subject: str, html_body: str) -> None:
    settings = get_settings()

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.MAIL_SERVER,
        port=settings.MAIL_PORT,
        start_tls=settings.MAIL_STARTTLS,
        use_tls=settings.MAIL_SSL_TLS,
        username=settings.MAIL_USERNAME or None,
        password=settings.MAIL_PASSWORD or None,
    )


async def send_task_assignment_email(
    recipient_email: str,
    recipient_name: str,
    task_title: str,
    assigner_name: str,
) -> None:
    settings = get_settings()
    if not settings.MAIL_ENABLED:
        logger.info(
            "Email disabled — would notify %s about task '%s'",
            recipient_email,
            task_title,
        )
        return

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #222;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #333; color: white; width: 40px; height: 40px; line-height: 40px; border-radius: 6px; font-weight: 700; font-size: 14px;">TF</div>
      </div>
      <h2 style="font-size: 18px; margin-bottom: 16px;">New Task Assigned</h2>
      <p style="color: #444; line-height: 1.6; margin-bottom: 16px;">
        Hi {recipient_name},
      </p>
      <p style="color: #444; line-height: 1.6; margin-bottom: 20px;">
        <strong>{assigner_name}</strong> has assigned you a new task:
      </p>
      <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
        <p style="font-weight: 600; font-size: 15px; margin: 0;">{task_title}</p>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 32px;">
        — The TaskFlow Team
      </p>
    </div>
    """

    try:
        await _send_email(recipient_email, f"Task Assigned: {task_title}", html_body)
        logger.info("Assignment email sent to %s", recipient_email)
    except Exception:
        logger.exception("Failed to send assignment email to %s", recipient_email)
