import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

interface OrderWorkflowStatusProps {
  status: string;
}

export const OrderWorkflowStatus = ({ status }: OrderWorkflowStatusProps) => {
  const steps = [
    { id: 'new', label: 'New Order', icon: Clock, description: 'Order received, awaiting review' },
    { id: 'pending', label: 'Confirmed', icon: CheckCircle2, description: 'Order confirmed by 9RX' },
    { id: 'processing', label: 'Processing', icon: Package, description: 'Order is being processed' },
    { id: 'shipped', label: 'Shipped', icon: Truck, description: 'Order has been shipped' }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === status.toLowerCase());

  return (
    <div className="py-4">
      <div className="relative flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-gray-100'
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`mt-2 text-sm font-medium ${
                isActive ? 'text-primary' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              <span className="text-xs text-gray-500 text-center mt-1 max-w-[120px]">
                {step.description}
              </span>
            </div>
          );
        })}
        
        {/* Progress bar */}
        <div className="absolute top-5 left-0 h-[2px] bg-gray-200 w-full -z-10">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ 
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};