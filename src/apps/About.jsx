export default function About() {
  return (
    <div className="about">
      <div className="about-face">☺</div>
      <h2>Welcome</h2>
      <p>
        This is my little Macintosh. Double-click the icons on the desktop
        to open my projects, games, and websites.
      </p>
      <p>
        Everything here is something I made. Poke around — open the{' '}
        <b>Web Browser</b> and visit my sites without leaving the desktop.
      </p>
      <p className="about-sig">
        Made with ❤︎ by <b>Noel Jackson</b>
        <br />
        aka <b>Sturdy Robot</b> 🤖
      </p>
      <p className="about-links">
        <a
          className="about-link"
          href="https://github.com/SturdyRobot"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/SturdyRobot
        </a>
      </p>
    </div>
  )
}
