import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

import { JsonLd, faqPageSchema, type FaqItem } from "@/components/seo/json-ld"

// Visible FAQ accordion + matching FAQPage JSON-LD in one component.
// FAQPage schema is what unlocks Google's "rich result" FAQ snippets in
// SERPs — a high-impact reason to use this on every alternative + use-case
// page that has a FAQ section.
export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  if (faqs.length === 0) return null

  return (
    <>
      <JsonLd data={faqPageSchema(faqs)} />
      <Accordion
        type="single"
        collapsible
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        {faqs.map((faq, idx) => (
          <AccordionItem
            key={faq.question}
            value={`faq-${idx}`}
            className="border-border-soft px-5 last:border-b-0"
          >
            <AccordionTrigger className="py-4 text-left text-[14px] font-medium hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-[13.5px] leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  )
}
