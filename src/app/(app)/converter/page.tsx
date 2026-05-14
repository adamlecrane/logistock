import { PageHeader } from "@/components/ui/page-header";
import { Converter } from "./_converter";

export default function ConverterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Convertisseur de monnaie"
        description="Taux de change en temps réel — utile pour vos achats fournisseurs"
      />
      <Converter />
    </div>
  );
}
