import { CreateVideoForm } from "@/components/CreateVideoForm";

export default function CreatePage() {
  return (
    <section className="page grid two">
      <div>
        <h1 className="page-title">Create</h1>
        <p className="lede">
          Queue one English 9:16 short. Stripe credits are checked before dispatch; Cloud Run handles the render.
        </p>
        <div className="notice">
          The worker must have provider keys and licensed media configured before live paid generation.
        </div>
      </div>
      <CreateVideoForm />
    </section>
  );
}
