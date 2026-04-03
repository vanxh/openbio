interface AnalyticsDigestProps {
  name: string;
  profileLink: string;
  views: number;
  uniqueViews: number;
  clicks: number;
  topReferrer: string | null;
  newSubscribers: number;
  unsubscribeUrl: string;
}

export default function AnalyticsDigest({
  name,
  profileLink,
  views,
  uniqueViews,
  clicks,
  topReferrer,
  newSubscribers,
  unsubscribeUrl,
}: AnalyticsDigestProps) {
  const profileUrl = `https://openbio.app/${profileLink}`;
  const clickRate = views > 0 ? Math.round((clicks / views) * 100) : 0;

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
        {/* Header with logo */}
        <div
          style={{
            padding: '28px 28px 0 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* biome-ignore lint/nursery/noImgElement: email template rendered by Resend, not Next.js */}
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

        {/* Title */}
        <div style={{ padding: '24px 28px 0 28px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#09090b',
              margin: '0 0 4px 0',
            }}
          >
            Your weekly digest
          </h1>
          <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
            Hi {name}, here&apos;s how{' '}
            <a
              href={profileUrl}
              style={{ color: '#7c3aed', textDecoration: 'none' }}
            >
              openbio.app/{profileLink}
            </a>{' '}
            performed this week.
          </p>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 28px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '8px 0',
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: '50%',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                    verticalAlign: 'top',
                  }}
                >
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#71717a',
                      margin: '0 0 4px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Views
                  </p>
                  <p
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#09090b',
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {views.toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#a1a1aa',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {uniqueViews.toLocaleString()} unique
                  </p>
                </td>
                <td
                  style={{
                    width: '50%',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '1px solid #e4e4e7',
                    verticalAlign: 'top',
                  }}
                >
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#71717a',
                      margin: '0 0 4px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Clicks
                  </p>
                  <p
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#09090b',
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    {clicks.toLocaleString()}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#a1a1aa',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {clickRate}% click rate
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Highlights */}
        <div style={{ padding: '0 28px 20px 28px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e4e4e7',
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
              Highlights
            </p>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
              }}
            >
              <tbody>
                {topReferrer && (
                  <tr>
                    <td style={{ padding: '6px 0', color: '#71717a' }}>
                      Top referrer
                    </td>
                    <td
                      style={{
                        padding: '6px 0',
                        color: '#7c3aed',
                        fontWeight: 500,
                        textAlign: 'right',
                      }}
                    >
                      {topReferrer}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 0', color: '#71717a' }}>
                    New subscribers
                  </td>
                  <td
                    style={{
                      padding: '6px 0',
                      color: '#09090b',
                      fontWeight: 500,
                      textAlign: 'right',
                    }}
                  >
                    {newSubscribers}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#71717a' }}>
                    Click rate
                  </td>
                  <td
                    style={{
                      padding: '6px 0',
                      color: '#09090b',
                      fontWeight: 500,
                      textAlign: 'right',
                    }}
                  >
                    {clickRate}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 28px 28px 28px', textAlign: 'center' }}>
          <a
            href={'https://openbio.app/app'}
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
            View full analytics
          </a>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #e4e4e7',
            padding: '20px 28px',
            fontSize: '12px',
            color: '#a1a1aa',
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <p style={{ margin: '0 0 6px 0' }}>
            Sent by{' '}
            <a
              href="https://openbio.app"
              style={{ color: '#7c3aed', textDecoration: 'none' }}
            >
              OpenBio
            </a>{' '}
            &middot; Your link-in-bio page
          </p>
          <p style={{ margin: 0 }}>
            <a
              href={unsubscribeUrl}
              style={{ color: '#a1a1aa', textDecoration: 'underline' }}
            >
              Unsubscribe from digest emails
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
