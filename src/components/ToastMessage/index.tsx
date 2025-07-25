import { useEffect, useState } from "react";
import styles from "./index.module.scss";
import { UseSub } from "../../utils/pubsub";

export interface ToastMessageEvent {
  message: string;
}

export const ToastMessage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [oldestMessageIndex, setOldestMessage] =
    useState(-1);
  const [agingMessageIndex, setAgingMessage] = useState(-1);

  const handleIncommingMessage = (message: string) => {
    console.log("new message: ", message);
    const newMessages = messages.slice() as string[];

    newMessages.push(message);

    setTimeout(() => {
      setAgingMessage(agingMessageIndex + 1);
    }, 3_000);
    setTimeout(() => {
      setOldestMessage(oldestMessageIndex + 1);
    }, 4_000);

    setMessages(newMessages);
  };

  const handleErrorMessage = (event: any) => {
    handleIncommingMessage(event.message!);
  };

  UseSub("ErrorMessage", handleErrorMessage);

  useEffect(() => {
    console.warn("new message has arrived", messages);
    console.log(
      oldestMessageIndex,
      agingMessageIndex,
      messages.length
    );
  }, [messages]);

  // useEffect(() => {
  //   handleIncommingMessage("test");
  // }, []);

  return (
    <div className={styles.Container}>
      {messages
        .slice(oldestMessageIndex)
        .map((message, index) => {
          return (
            <p
              key={message}
              className={`${styles.Bubble} ${
                index <= agingMessageIndex
                  ? styles.BubbleHide
                  : styles.BubbleShow
              }`}
            >
              {message}
            </p>
          );
        })}
    </div>
  );
};
