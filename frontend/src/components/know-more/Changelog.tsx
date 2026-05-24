// src/components/know-more/Changelog.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import styles from "./Changelog.module.css";
import { CHANGELOG_DATA } from "../../data/app/versions";

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
                aria-expanded={isMainOpen}
                aria-controls="changelog-content"
            >
                {isMainOpen
                    ? "[-] CERRAR ARCHIVO DE VERSIONES"
                    : "[+] ABRIR ARCHIVO DE VERSIONES"}
            </button>

            {/* Envoltorio animado principal */}
            <div
                id="changelog-content"
                className={`${styles.collapsibleWrapper} ${isMainOpen ? styles.collapsibleWrapperOpen : ""}`}
                role="region"
                aria-label="Historial de cambios"
            >
                <div className={styles.collapsibleInner}>
                    <div className={styles.changelogContent}>
                        {CHANGELOG_DATA.map((release) => (
                            <section key={release.id} className={styles.releaseBlock} aria-labelledby={`release-${release.id}`}>
                                <div className={styles.releaseHeader}>
                                    <h2 id={`release-${release.id}`} className={styles.versionTitle}>
                                        v{release.version} - {release.description}
                                    </h2>
                                    <time className={styles.date}>
                                        FECHA DE PUBLICACIÓN: {release.date}
                                    </time>
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
                                        aria-expanded={openNotes[release.id] ?? false}
                                        aria-controls={`notes-${release.id}`}
                                    >
                                        {openNotes[release.id]
                                            ? "▲ Ocultar notas de desarrollo"
                                            : "▼ Abrir notas de desarrollo"}
                                    </button>

                                    {/* Envoltorio animado secundario para las notas */}
                                    <div
                                        id={`notes-${release.id}`}
                                        className={`${styles.collapsibleWrapper} ${openNotes[release.id] ? styles.collapsibleWrapperOpen : ""}`}
                                        role="region"
                                        aria-label={`Notas de desarrollo v${release.version}`}
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
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}