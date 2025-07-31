import { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";
import { UseSub } from "../../utils/pubsub";

export interface ToastMessageEvent {
  message: string;
}

export const ToastMessage = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [oldestMessage, setOldest] = useState<number>(0);
  const [agingMessage, setAging] = useState<number>(0);

  const oldestMessageIndex = useRef(0);
  const agingMessageIndex = useRef(0);
  const allMessages = useRef<string[]>([]);

  const handleIncommingMessage = (message: string) => {
    console.log("new message: ", message);
    allMessages.current.push(message);
    setMessages(allMessages.current.slice());

    setTimeout(() => {
      agingMessageIndex.current += 1;
    }, 3_000);
    setTimeout(() => {
      oldestMessageIndex.current += 1;
      setMessages(
        allMessages.current.slice(
          oldestMessageIndex.current
        )
      );
    }, 4_000);
  };

  const handleInfoMessage = (event: any) => {
    handleIncommingMessage(event.message!);
  };
  const handleErrorMessage = (event: any) => {
    handleIncommingMessage(event.message!);
  };

  UseSub("InfoMessage", handleInfoMessage);
  UseSub("ErrorMessage", handleErrorMessage);

  useEffect(() => {
    console.warn("new message has arrived", messages);
    console.log(
      oldestMessageIndex,
      agingMessageIndex,
      messages.length
    );
  }, [messages]);

  const ref = useRef(0);
  const count = useRef(0);
  useEffect(() => {
    ref.current += 1;
    if (ref.current > 1) return;
    setInterval(() => {
      count.current += 1;
      if (count.current > 10) return;
      handleIncommingMessage(
        "test" + new Date().toISOString()
      );
    }, 1_000);
  }, []);

  return (
    <div className={styles.Container}>
      {messages.map((message, index) => {
        return (
          <p
            key={`${message}`}
            className={`${styles.Bubble} ${
              index <
              allMessages.current.length -
                agingMessageIndex.current -
                1
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
