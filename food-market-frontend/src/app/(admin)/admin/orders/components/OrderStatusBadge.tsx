// src/app/(admin)/admin/orders/components/OrderStatusBadge.tsx

import { OrderStatus, getOrderStatusLabel } from '@/app/type/Order';
import {
    Clock,
    CheckCircle,
    Package,
    Truck,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import styles from '@/styles/admin/Orders.module.css';

type OrderStatusBadgeProps = {
    status: OrderStatus;
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const getStatusIcon = () => {
        const iconProps = { size: 14 };
        switch (status) {
            case OrderStatus.PENDING:
                return <Clock {...iconProps} />;
            case OrderStatus.CONFIRMED:
                return <CheckCircle {...iconProps} />;
            case OrderStatus.PROCESSING:
                return <Package {...iconProps} />;
            case OrderStatus.OUT_FOR_DELIVERY:
                return <Truck {...iconProps} />;
            case OrderStatus.DELIVERED:
                return <CheckCircle2 {...iconProps} />;
            case OrderStatus.CANCELLED:
                return <XCircle {...iconProps} />;
        }
    };

    const getStatusClass = () => {
        switch (status) {
            case OrderStatus.PENDING:
                return styles.statusPending;
            case OrderStatus.CONFIRMED:
                return styles.statusConfirmed;
            case OrderStatus.PROCESSING:
                return styles.statusProcessing;
            case OrderStatus.OUT_FOR_DELIVERY:
                return styles.statusOutForDelivery;
            case OrderStatus.DELIVERED:
                return styles.statusDelivered;
            case OrderStatus.CANCELLED:
                return styles.statusCancelled;
        }
    };

    return (
        <span className={`${styles.statusBadge} ${getStatusClass()}`}>
            {getStatusIcon()}
            {getOrderStatusLabel(status)}
        </span>
    );
}
