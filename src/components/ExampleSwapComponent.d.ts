declare module '@/components/ExampleSwapComponent' {
  interface SwapHistory {
    id: string;
    amount: string;
    status: 'completed' | 'pending' | 'failed';
    date: string;
  }

  interface ExampleSwapComponentProps {
    onSwap: (data: { amount: string; address: string; type: string }) => void;
    onError: (error: string) => void;
    balance?: number;
    enablePartialFill?: boolean;
    swapHistory?: SwapHistory[];
  }

  export function ExampleSwapComponent(props: ExampleSwapComponentProps): JSX.Element;
} 