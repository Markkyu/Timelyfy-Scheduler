import { useEffect, useState } from "react";
import { Snackbar, Alert, LinearProgress, Slide } from "@mui/material";

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

export default function ToastNotification({
  message,
  type = "error",
  duration = 2000,
  trigger,
}) {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (message) {
      setOpen(false); // reset before showing again
      setTimeout(() => setOpen(true), 10); // allow React to re-open it
      setProgress(100);

      const interval = setInterval(() => {
        setProgress((prev) => (prev > 0 ? prev - 100 / (duration / 100) : 0));
      }, 100);

      const timer = setTimeout(() => {
        setOpen(false);
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [message, trigger, duration]);

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={SlideTransition}
      onClose={() => setOpen(false)}
      autoHideDuration={duration}
    >
      <Alert
        severity={type}
        sx={{
          width: "100%",
          fontWeight: 600,
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        {message}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1,
            height: 4,
            borderRadius: 5,
            backgroundColor: "rgba(255,255,255,0.5)",
            "& .MuiLinearProgress-bar": { backgroundColor: "white" },
          }}
        />
      </Alert>
    </Snackbar>
  );
}
