import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type SnackType = "success" | "error" | "warning" | "info";

interface SnackState {
  open: boolean;
  message: string;
  type: SnackType;
}

interface SnackbarContextType {
  enqueueSnackbar: (message: string, type?: SnackType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return context;
};

interface ProviderProps {
  children: ReactNode;
}

const SnackbarProvider = ({ children }: ProviderProps) => {
  const [snack, setSnack] = useState<SnackState>({
    open: false,
    message: "",
    type: "info",
  });

  const enqueueSnackbar = useCallback(
    (message: string, type: SnackType = "info") => {
      setSnack({ open: true, message, type });

      setTimeout(() => {
        setSnack((prev) => ({ ...prev, open: false }));
      }, 2000);
    },
    []
  );

  const handleClose = () => {
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const snackStyles = {
    success: {
      wrapper: "bg-emerald-50 border border-emerald-200 text-emerald-700",
      icon: "fa-solid fa-circle-check text-emerald-600",
      progress: "bg-emerald-500",
    },
    error: {
      wrapper: "bg-rose-50 border border-rose-200 text-rose-700",
      icon: "fa-solid fa-circle-exclamation text-rose-600",
      progress: "bg-rose-500",
    },
    warning: {
      wrapper: "bg-amber-50 border border-amber-200 text-amber-700",
      icon: "fa-solid fa-triangle-exclamation text-amber-600",
      progress: "bg-amber-500",
    },
    info: {
      wrapper: "bg-sky-50 border border-sky-200 text-sky-700",
      icon: "fa-solid fa-circle-info text-sky-600",
      progress: "bg-sky-500",
    },
  }[snack.type];

  return (
    <SnackbarContext.Provider value={{ enqueueSnackbar }}>
      {children}

      {snack.open && (
        <div className="fixed top-5 right-5 z-[9999]">
          <div
            className={`rounded-sm shadow-lg overflow-hidden px-4 py-3 text-sm font-bold flex items-center justify-between space-x-3 animate-in fade-in zoom-in duration-300 ${snackStyles.wrapper}`}
          >
            <div className="flex items-center space-x-3">
              <i className={`${snackStyles.icon} text-lg`}></i>
              <span>{snack.message}</span>
            </div>

            <button
              onClick={handleClose}
              className="ml-3 text-lg opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>

          <div className="h-1 bg-gray-200 rounded-b-xl overflow-hidden">
            <div
              className={`h-full ${snackStyles.progress} animate-[progress_2s_linear]`}
            />
          </div>
        </div>
      )}
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;
