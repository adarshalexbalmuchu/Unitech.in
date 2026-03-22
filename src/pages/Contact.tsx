import { useState } from "react";
import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      toast.success("Message sent!", { description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", subject: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StickyHeader />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-8">Contact Us</h1>

        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Send us a message</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="How can we help?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required rows={5} placeholder="Describe your query..." />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message"}</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Email</p>
                <p className="text-sm text-muted-foreground">unitechindia@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Phone</p>
                <p className="text-sm text-muted-foreground">9810448343</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Location</p>
                <p className="text-sm text-muted-foreground">Pan-India delivery & service</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Contact;
