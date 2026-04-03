interface ResetPasswordProps {
  url: string;
}

export default function ResetPassword({ url }: ResetPasswordProps) {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f4f4f5',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 28px 0 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* biome-ignore lint/nursery/noImgElement: email template */}
          <img
            src="https://openbio.app/openbio.png"
            alt="OpenBio"
            width="32"
            height="32"
            style={{ borderRadius: '8px' }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#09090b',
              letterSpacing: '-0.01em',
            }}
          >
            OpenBio
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px 28px 28px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#09090b',
              margin: '0 0 16px 0',
            }}
          >
            Reset your password
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 12px 0',
            }}
          >
            We received a request to reset your OpenBio password. Click the
            button below to choose a new one.
          </p>

          <p
            style={{
              fontSize: '13px',
              color: '#a1a1aa',
              margin: '0 0 24px 0',
            }}
          >
            This link will expire in 1 hour.
          </p>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <a
              href={url}
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                backgroundColor: '#09090b',
                color: '#ffffff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Reset password
            </a>
          </div>

          <p
            style={{
              fontSize: '12px',
              color: '#a1a1aa',
              margin: 0,
            }}
          >
            If you didn&apos;t request a password reset, you can safely ignore
            this email. Your password will not be changed.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e4e4e7',
            padding: '16px 28px',
            fontSize: '12px',
            color: '#a1a1aa',
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <p style={{ margin: 0 }}>
            <a
              href="https://openbio.app"
              style={{ color: '#7c3aed', textDecoration: 'none' }}
            >
              OpenBio
            </a>{' '}
            &middot; Your link-in-bio page
          </p>
        </div>
      </div>
    </div>
  );
}
