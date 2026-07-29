import site from "@/content/site.json";

type StructuredDataProps = {
  project?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
};

export default function StructuredData({ project }: StructuredDataProps) {
  const baseUrl = site.siteUrl || "https://fengshui-interior.pages.dev";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: site.brandName,
      url: baseUrl,
      logo: `${baseUrl}${site.logo}`,
      sameAs: [site.blogUrl, site.instagramUrl].filter((url) => url && url !== "#"),
    },
    {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}/#localbusiness`,
      name: site.brandName,
      url: baseUrl,
      image: `${baseUrl}${site.seo.ogImage}`,
      telephone: site.contact.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.contact.address,
        addressCountry: "KR",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: site.brandName,
      url: baseUrl,
      publisher: { "@id": `${baseUrl}/#organization` },
      inLanguage: "ko-KR",
    },
  ];

  if (project) {
    graph.push({
      "@type": "CreativeWork",
      "@id": `${baseUrl}${project.url}#project`,
      name: project.title,
      description: project.description,
      url: `${baseUrl}${project.url}`,
      image: `${baseUrl}${project.image}`,
      creator: { "@id": `${baseUrl}/#organization` },
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
