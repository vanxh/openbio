export default function CancelledEmail() {
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
            Your Pro subscription has been cancelled
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 12px 0',
            }}
          >
            We&apos;re sorry to see you go. Your Pro features will remain active
            until the end of your current billing period.
          </p>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}
          >
            After that, your account will revert to the free plan. Your profile
            links and content will be preserved.
          </p>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
              marginBottom: '24px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#52525b',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Changed your mind? You can resubscribe anytime from your dashboard
              settings to restore Pro features instantly.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <a
              href="https://openbio.app/app"
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
              Go to dashboard
            </a>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 4px 0',
            }}
          >
            If there&apos;s anything we could have done better, I&apos;d love to
            hear about it — just reply to this email.
          </p>
          <p style={{ fontSize: '14px', color: '#52525b', margin: 0 }}>
            &mdash; Vanxh
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
