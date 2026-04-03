interface ResetPasswordProps {
  url: string;
}

export default function ResetPassword({ url }: ResetPasswordProps) {
  return (
    <div
      style={{
        fontFamily: 'sans-serif',
        maxWidth: '480px',
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#ffffff',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '16px',
          color: '#111111',
        }}
      >
        Reset your password
      </h1>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '8px' }}>
        We received a request to reset your OpenBio password. Click the button
        below to choose a new password.
      </p>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '32px' }}>
        This link will expire in 1 hour.
      </p>
      <a
        href={url}
        style={{
          display: 'inline-block',
          padding: '12px 28px',
          backgroundColor: '#7c3aed',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '15px',
        }}
      >
        Reset password
      </a>
      <p
        style={{
          fontSize: '13px',
          color: '#888888',
          marginTop: '32px',
        }}
      >
        If you didn&apos;t request a password reset, you can safely ignore this
        email. Your password will not be changed.
      </p>
    </div>
  );
}
