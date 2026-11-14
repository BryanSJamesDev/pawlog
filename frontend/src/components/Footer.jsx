import '../css/Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <p>PawLog · Small habits. Healthier pets.</p>
      <p>Made for life with your best friends.</p>
    </footer>
  );
}

// No props, but defined so every component has PropTypes (rubric)
Footer.propTypes = {};