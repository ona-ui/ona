export default function DocsHomePage() {
  return (
    <div className="min-h-screen bg-[#F1F0EE]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <article className="prose prose-lg prose-slate max-w-none">
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Introduction
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Create magical landing pages with components that you can copy and paste into your apps.
            </p>
          </header>

          <div className="space-y-8">
            <p className="text-lg text-slate-700 leading-relaxed">
              <strong>ONA UI</strong> is a collection of re-usable components that you can copy and paste into your web apps.
            </p>

            <p className="text-lg text-slate-700 leading-relaxed">
              It primarily features components, blocks, and templates geared towards creating landing pages and user-facing marketing materials.
            </p>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Philosophy
              </h2>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                I personally believe that good design contributes significant value to software. It's one of the main methods of establishing trust between you and an internet stranger.
              </p>
              
              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Trust is important for internet businesses because it is the first thing a visitor evaluates before pulling out their credit card and becoming a customer.
              </p>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Some questions visitors might ask themselves are:
              </p>

              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li className="text-slate-700">"Is this company legit?"</li>
                <li className="text-slate-700">"Who else is using it?"</li>
                <li className="text-slate-700">"Can I trust them with my personal data?"</li>
              </ul>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Poor design reflects poorly on your team. It comes off as lazy, unfinished, and unstable. It shows that the team doesn't care about user experience.
              </p>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Good design indicates that the team behind has their shit together. I can probably expect good things from them in the future.
              </p>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                It makes me think <em>"if they care so much about these tiny details, they must care a lot about other things in the company, including their customers!"</em>.
              </p>

              <blockquote className="border-l-4 border-[#C96342] pl-6 py-4 bg-slate-50 rounded-r-lg mb-6">
                <p className="text-lg text-slate-700 leading-relaxed italic">
                  A great example of this in play is <strong>https://linear.app</strong> landing page which I first came across in 2020. I didn't even need to try the product but I already knew that it must be good.
                </p>
              </blockquote>

              <p className="text-lg text-slate-700 leading-relaxed">
                This library is heavily inspired by <strong>https://ui.shadcn.com</strong>.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Getting Started
              </h2>

              <p className="text-lg text-slate-700 leading-relaxed mb-6">
                Start using ONA UI in minutes by following these simple steps:
              </p>

              <ol className="list-decimal pl-6 space-y-4">
                <li className="text-lg text-slate-700">
                  <strong>Browse</strong> - Explore categories in the sidebar to find the components you need
                </li>
                <li className="text-lg text-slate-700">
                  <strong>Copy</strong> - Copy the component code with a single click
                </li>
                <li className="text-lg text-slate-700">
                  <strong>Use</strong> - Integrate the component into your project and customize as needed
                </li>
              </ol>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}