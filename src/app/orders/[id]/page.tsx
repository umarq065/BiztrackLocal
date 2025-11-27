import { getOrderById } from "@/lib/services/ordersService";
import { getIncomeSources } from "@/lib/services/incomesService";
import { notFound } from "next/navigation";
import { OrderDetailsView } from "@/components/orders/order-details-view";

interface OrderPageProps {
    params: {
        id: string;
    };
}

export default async function OrderPage({ params }: OrderPageProps) {
    const [order, incomeSources] = await Promise.all([
        getOrderById(params.id),
        getIncomeSources()
    ]);

    if (!order) {
        notFound();
    }

    return <OrderDetailsView initialOrder={order} incomeSources={incomeSources} />;
}
