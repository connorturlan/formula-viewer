import { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import { UseSub } from "../../utils/pubsub";

export interface ToastMessageEvent {
  message: string;
}

export const ToastMessage = () => {
  const [oldestMessage, setOldest] = useState<number>(0);
  const [agingMessage, setAging] = useState<number>(0);

  const allMessages = useRef<string[]>([]);

  const handleIncommingMessage = (message: string) => {
    console.log("new message: ", message);
    allMessages.current.push(message);

    const messageIndex = allMessages.current.length;

    setTimeout(() => {
      setAging(messageIndex);
      setTimeout(() => {
        setOldest(messageIndex);
      }, 500);
    }, 3_000);
  };

  const handleInfoMessage = (event: any) => {
    handleIncommingMessage(`[INFO]${event.message!}`);
  };
  const handleErrorMessage = (event: any) => {
    handleIncommingMessage(`[ERROR]${event.message!}`);
  };

  UseSub("InfoMessage", handleInfoMessage);
  UseSub("ErrorMessage", handleErrorMessage);

  useEffect(() => {
    console.warn(
      "new message has arrived",
      allMessages.current
    );
    console.log(
      oldestMessage,
      agingMessage,
      allMessages.current.length
    );
  }, [allMessages.current]);

  useEffect(() => {
    handleIncommingMessage("notifications ready");
  }, []);

  return (
    <div className={styles.Container}>
      {allMessages.current
        .slice(oldestMessage)
        .map((message, index) => {
          let messageClass = styles.BubbleInfo;

          if (message.startsWith("[INFO]"))
            messageClass = styles.BubbleInfo;
          else if (message.startsWith("[WARN]"))
            messageClass = styles.BubbleWarn;
          else if (message.startsWith("[ERROR]"))
            messageClass = styles.BubbleError;

          return (
            <p
              key={`${index + oldestMessage} ${message}`}
              className={`${styles.Bubble} ${
                index + oldestMessage < agingMessage
                  ? styles.BubbleHide
                  : styles.BubbleShow
              } ${messageClass}`}
            >
              {message}
            </p>
          );
        })}
    </div>
  );
};
