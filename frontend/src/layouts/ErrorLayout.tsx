import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./ErrorLayout.module.css";

interface ErrorLayoutProps {
    title: string;
    description: ReactNode;
    subtitle: string;
    buttonText?: string;
    returnPath?: string;
}

export default function ErrorLayout({
    title,
    description,
    subtitle,
    buttonText = "Volver al puesto de trabajo",
    returnPath = "/",
}: ErrorLayoutProps) {
    return (
        <div className={styles.wallBackground}>
            <div className={styles.paper}>
                {/* La Cinta Adhesiva (Celofán realista) */}
                <div className={styles.tape} />

                <div className={styles.content}>
                    <FiAlertTriangle className={styles.icon} />

                    <p className={styles.stamp}>
                        Comunicado Oficial
                    </p>

                    <h1 className={styles.title}>
                        {title}
                    </h1>

                    <div className={styles.descriptionBox}>
                        <p>{description}</p>
                        <p className={styles.subtitle}>
                            {subtitle}
                        </p>
                    </div>

                    <Link to={returnPath} className={styles.button}>
                        {buttonText}
                    </Link>
                </div>
            </div>
        </div>
    );
}