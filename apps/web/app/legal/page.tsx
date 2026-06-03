export default function LegalPage() {
  return (
    <section className="page grid">
      <div>
        <h1 className="page-title">Legal</h1>
        <p className="lede">Launch placeholders for required commercial SaaS policies.</p>
      </div>
      <div className="grid two">
        {["Terms of Service", "Privacy Policy", "Refund Policy", "Acceptable Use Policy", "DMCA/Copyright Policy"].map(
          (title) => (
            <article className="panel panel-pad" key={title}>
              <h2>{title}</h2>
              <p className="muted">
                Replace before launch with reviewed policy text that covers paid AI generation, storage, refunds,
                provider usage, copyright, and abuse handling.
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
