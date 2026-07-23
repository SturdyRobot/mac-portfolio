export default function About() {
  return (
    <div className="about">
      <div className="about-face">☺</div>
      <h2>Hi, I&rsquo;m Noel</h2>
      <p>
        I&rsquo;m a developer who goes by <b>Sturdy Robot</b> online. I like
        building things all the way through: the idea, the code, and the small
        details nobody asked for.
      </p>
      <p>
        This desktop is a good example. It&rsquo;s a portfolio, but I wanted it to
        be something you could actually use, so I made it a working operating
        system. Open the <b>Web Browser</b> and it loads my real sites, right here
        on the desktop.
      </p>
      <p className="about-sig">
        Built by <b>Noel Jackson</b>
        <br />
        aka <b>Sturdy Robot</b> 🤖
      </p>
      <p className="about-links">
        <a className="about-link" href="mailto:noeljacksonjs@gmail.com">
          noeljacksonjs@gmail.com
        </a>
        <br />
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
