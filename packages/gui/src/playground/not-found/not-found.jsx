import "../import-first";
import React from "react";
import render from "../app-target";
import styles from "../info.css";
import * as bowser from "bowser";

import { APP_NAME } from "@ampmod/branding";
import { applyGuiColors } from "../../lib/themes/guiHelpers";
import { detectTheme } from "../../lib/themes/themePersistance";

/* eslint-disable react/jsx-no-literals */

applyGuiColors(detectTheme());
document.documentElement.lang = "en";

const Project = ({ id }) => (
        <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0 }}>
            <iframe
                src={`https://ampmod.codeberg.page/editor#${id}`}
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    margin: 0,
                    padding: 0,
                }}
                title={`Project Editor ${id}`}
            />
        </div>
);

let projectId = null;
if(window.location.path.includes('projects')) {
  const match = window.location.pathname.match(/^\/projects\/(\d+)$/);
  const projectId = match ? match[1] : null;
}

const Home = () => (
    <>
        <header
            className={`${styles.headerContainer} ${styles.headerContainerAltColour}`}
        >
            <h1 className={styles.headerText}>404 Not Found</h1>
            <p className={styles.headerText}>
                Sorry, this page doesn't appear to exist.
            </p>
        </header>
        <main className={styles.main}>
            <section>
                <p>
                    Are you looking for the{" "}
                    <a href="editor">{APP_NAME} editor</a> or{" "}
                    <a href="player">player</a>?
                </p>
                <p>
                    If you have any questions or concerns, you can post on the{" "}
                    <a href={APP_NAME}>forums</a>.
                </p>
            </section>
        </main>
    </>
);

render(projectId ? <Project id={projectId} /> : <Home />);
