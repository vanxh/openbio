interface VerifyEmailProps {
  url: string;
}

export default function VerifyEmail({ url }: VerifyEmailProps) {
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
        Verify your email
      </h1>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '8px' }}>
        Thanks for signing up for OpenBio! Please verify your email address by
        clicking the button below.
      </p>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '32px' }}>
        This link will expire in 24 hours.
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
        Verify email
      </a>
      <p
        style={{
          fontSize: '13px',
          color: '#888888',
          marginTop: '32px',
        }}
      >
        If you didn&apos;t create an OpenBio account, you can safely ignore this
        email.
      </p>
    </div>
  );
}
