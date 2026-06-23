from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from core.config import settings

# Configure FastMail using settings
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=bool(settings.MAIL_USERNAME),
    VALIDATE_CERTS=True
)

async def send_verification_email(email: str, token: str):
    """Sends an email with the verification link."""
    if not settings.MAIL_USERNAME or not settings.MAIL_SERVER:
        print(f"Mock Email sent to {email}. Verification Link: {settings.FRONTEND_URL}/verify-email?token={token}")
        return

    html = f"""
    <p>Welcome to Aletheox!</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="{settings.FRONTEND_URL}/verify-email?token={token}">Verify Email</a>
    <p>If you did not request this, please ignore this email.</p>
    """

    message = MessageSchema(
        subject="Aletheox - Verify your email",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)

async def send_reset_password_email(email: str, token: str):
    """Sends an email with the password reset link."""
    if not settings.MAIL_USERNAME or not settings.MAIL_SERVER:
        print(f"Mock Email sent to {email}. Reset Link: {settings.FRONTEND_URL}/reset-password?token={token}")
        return

    html = f"""
    <p>Password Reset Request</p>
    <p>Please click the link below to reset your password. This link will expire in 30 minutes.</p>
    <a href="{settings.FRONTEND_URL}/reset-password?token={token}">Reset Password</a>
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    """

    message = MessageSchema(
        subject="Aletheox - Password Reset Request",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
