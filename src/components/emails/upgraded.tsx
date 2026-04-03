export default function UpgradedEmail() {
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
            You&apos;re now on Pro!
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 12px 0',
            }}
          >
            Thank you for upgrading to OpenBio Pro! Your support means a lot.
          </p>

          <p
            style={{
              fontSize: '14px',
              color: '#52525b',
              lineHeight: 1.6,
              margin: '0 0 24px 0',
            }}
          >
            You now have access to all card types, themes, custom domains,
            advanced analytics, and more.
          </p>

          {/* Pro features */}
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
                fontWeight: 600,
                color: '#09090b',
                margin: '0 0 12px 0',
              }}
            >
              What&apos;s unlocked
            </p>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#52525b' }}>
                    ✓ Unlimited profile links
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#52525b' }}>
                    ✓ All card types &amp; themes
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#52525b' }}>
                    ✓ Custom domain &amp; footer
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#52525b' }}>
                    ✓ Advanced analytics
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#52525b' }}>
                    ✓ Verified badge
                  </td>
                </tr>
              </tbody>
            </table>
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
            If you have feedback or ideas, just reply to this email.
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
