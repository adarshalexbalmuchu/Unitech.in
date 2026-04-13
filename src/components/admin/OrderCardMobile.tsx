import { useState } from "react";
import { ChevronDown, ChevronUp, Truck, ExternalLink, Loader2, Tag, Calendar, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/constants";

interface OrderCardMobileProps {
  order: {
    id: string;
    status: string;
    fulfillment_status: string;
    shipping_snapshot: { name?: string; phone?: string; pincode?: string };
    amount_total_paise: number;
    created_at: string;
    shipment_id?: string;
    awb_number?: string;
    courier_name?: string;
    tracking_url?: string;
    label_generated_at?: string;
    pickup_scheduled_date?: string;
    manifested_at?: string;
  };
  statusConfig: { label: string; color: string };
  isLoading: boolean;
  onPush: () => void;
  onLabel: () => void;
  onPickup: () => void;
  onManifest: () => void;
}

const OrderCardMobile = ({ order, statusConfig, isLoading, onPush, onLabel, onPickup, onManifest }: OrderCardMobileProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 min-h-[60px]" onClick={() => setExpanded((e) => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-foreground">{order.id.slice(0, 8)}</span>
            <Badge variant="secondary" className={`text-[10px] ${statusConfig.color}`}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.shipping_snapshot?.name || "—"} · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums shrink-0">{formatPrice(order.amount_total_paise / 100)}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-3 py-3 space-y-3">
          {/* Details */}
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <p className="text-muted-foreground">Payment</p>
            <p className="text-foreground font-medium capitalize">{order.status}</p>
            {order.awb_number && (
              <>
                <p className="text-muted-foreground">AWB</p>
                <p className="text-foreground font-mono">{order.awb_number}</p>
              </>
            )}
            {order.courier_name && (
              <>
                <p className="text-muted-foreground">Courier</p>
                <p className="text-foreground">{order.courier_name}</p>
              </>
            )}
            {order.shipping_snapshot?.pincode && (
              <>
                <p className="text-muted-foreground">Pincode</p>
                <p className="text-foreground">{order.shipping_snapshot.pincode}</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}

            {(order.fulfillment_status === "sr_push_failed" || order.fulfillment_status === "manual_review") && (
              <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={onPush} disabled={!!isLoading}>
                <Truck className="w-3.5 h-3.5 mr-1" /> Push to SR
              </Button>
            )}

            {order.awb_number && !order.label_generated_at && (
              <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={onLabel} disabled={!!isLoading}>
                <Tag className="w-3.5 h-3.5 mr-1" /> Label
              </Button>
            )}

            {order.label_generated_at && !order.pickup_scheduled_date && order.shipment_id && (
              <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={onPickup} disabled={!!isLoading}>
                <Calendar className="w-3.5 h-3.5 mr-1" /> Pickup
              </Button>
            )}

            {order.pickup_scheduled_date && !order.manifested_at && (
              <Button size="sm" variant="outline" className="text-xs min-h-[44px]" onClick={onManifest} disabled={!!isLoading}>
                <FileText className="w-3.5 h-3.5 mr-1" /> Manifest
              </Button>
            )}

            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline min-h-[44px] px-2"
              >
                Track <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCardMobile;
