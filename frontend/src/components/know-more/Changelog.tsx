// src/components/know-more/Changelog.tsx

import { useState } from "react";
import styles from "./Changelog.module.css";
import { CHANGELOG_DATA } from "../../data/versions";

export default function Changelog() {
    const [isMainOpen, setIsMainOpen] = useState(false);
    const [openNotes, setOpenNotes] = useState<Record<number, boolean>>({});

    const toggleNotes = (id: number) => {
        setOpenNotes((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.mainToggle}
                onClick={() => setIsMainOpen(!isMainOpen)}
            >
                {isMainOpen
                    ? "[-] CERRAR ARCHIVO DE VERSIONES"
                    : "[+] ABRIR ARCHIVO DE VERSIONES"}
            </button>

            {/* Envoltorio animado principal */}
            <div
                className={`${styles.collapsibleWrapper} ${isMainOpen ? styles.collapsibleWrapperOpen : ""}`}
            >
                <div className={styles.collapsibleInner}>
                    <div className={styles.changelogContent}>
                        {CHANGELOG_DATA.map((release) => (
                            <div key={release.id} className={styles.releaseBlock}>
                                <div className={styles.releaseHeader}>
                                    <h3 className={styles.versionTitle}>
                                        v{release.version} - {release.description}
                                    </h3>
                                    <span className={styles.date}>
                                        FECHA DE PUBLICACIÓN: {release.date}
                                    </span>
                                </div>

                                <ul className={styles.changesList}>
                                    {release.changes.map((change, index) => (
                                        <li key={index}>{change}</li>
                                    ))}
                                </ul>

                                <div className={styles.notesSection}>
                                    <button
                                        className={styles.notesToggle}
                                        onClick={() => toggleNotes(release.id)}
                                    >
                                        {openNotes[release.id]
                                            ? "▲ Ocultar notas de desarrollo"
                                            : "▼ Abrir notas de desarrollo"}
                                    </button>

                                    {/* Envoltorio animado secundario para las notas */}
                                    <div
                                        className={`${styles.collapsibleWrapper} ${openNotes[release.id] ? styles.collapsibleWrapperOpen : ""}`}
                                    >
                                        <div className={styles.collapsibleInner}>
                                            <div className={styles.notesContent}>
                                                {release.notes.map((note, index) => (
                                                    <p key={index}>{note}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}