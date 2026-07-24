export default function About() {
  return (
    <div className="about">
      <div className="about-face">☺</div>
      <h2>Hi, I&rsquo;m Noel</h2>
      <p>
        I&rsquo;m a developer who goes by <b>nlj</b> online. I like
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
        aka <b>nlj</b> 🤖
      </p>
      <p className="about-links">
        <a className="about-link" href="mailto:noel@nlj.dev">
          noel@nlj.dev
        </a>
        <br />
        <a
          className="about-link"
          href="https://github.com/nlj3"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/nlj3
        </a>
      </p>
    </div>
  )
}
