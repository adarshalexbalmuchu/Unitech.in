import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SpecEntry {
  key: string;
  value: string;
}

interface SpecsEditorProps {
  specs: Record<string, string>;
  onChange: (specs: Record<string, string>) => void;
}

function toEntries(specs: Record<string, string>): SpecEntry[] {
  const entries = Object.entries(specs).map(([key, value]) => ({ key, value }));
  return entries.length > 0 ? entries : [{ key: "", value: "" }];
}

function toObject(entries: SpecEntry[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const entry of entries) {
    const k = entry.key.trim();
    if (k) obj[k] = entry.value;
  }
  return obj;
}

const SpecsEditor = ({ specs, onChange }: SpecsEditorProps) => {
  const entries = toEntries(specs);

  const update = (index: number, field: "key" | "value", val: string) => {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: val } : e));
    onChange(toObject(next));
  };

  const add = () => {
    onChange(toObject([...entries, { key: "", value: "" }]));
  };

  const remove = (index: number) => {
    const next = entries.filter((_, i) => i !== index);
    onChange(toObject(next.length > 0 ? next : [{ key: "", value: "" }]));
  };

  return (
    <div className="space-y-3">
      <Label>Specifications</Label>
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Key (e.g. Power)"
            value={entry.key}
            onChange={(e) => update(i, "key", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Value (e.g. 2200W)"
            value={entry.value}
            onChange={(e) => update(i, "value", e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="min-h-[44px]">
        <Plus className="h-4 w-4 mr-1.5" /> Add Spec
      </Button>
    </div>
  );
};

export default SpecsEditor;
