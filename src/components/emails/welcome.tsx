interface WelcomeEmailProps {
  name?: string;
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
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
        Welcome to OpenBio.app {name ? `👋 ${name}` : '👋'}
      </h1>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '8px' }}>
        {name ? `Hey ${name}!` : 'Hey!'} Thank you for signing up for OpenBio.
      </p>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '8px' }}>
        I hope you will enjoy OpenBio and that it will help you build a better
        link in bio.
      </p>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '32px' }}>
        If you have any questions about setting up your link in bio, please feel
        free to reply to this email. I&apos;m always happy to help out.
      </p>
      <p style={{ fontSize: '16px', color: '#444444', marginBottom: '4px' }}>
        Thank you,
      </p>
      <a
        href="https://twitter.com/vanxhh"
        style={{ color: '#7c3aed', fontWeight: 600, fontSize: '16px' }}
      >
        Vanxh
      </a>
      <p style={{ fontSize: '14px', color: '#888888', marginTop: '32px' }}>
        ⭐ Star{' '}
        <a href="https://github.com/vanxh/openbio" style={{ color: '#7c3aed' }}>
          OpenBio
        </a>{' '}
        on GitHub
      </p>
    </div>
  );
}
