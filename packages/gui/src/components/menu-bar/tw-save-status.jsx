import { connect } from "react-redux";
import { FormattedMessage } from "react-intl";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import InlineMessages from "../../containers/inline-messages.jsx";
import SB3Downloader from "../../containers/sb3-downloader.jsx";
import { filterInlineAlerts } from "../../reducers/alerts";
import classNames from "classnames";

import VM from "scratch-vm"; // import VM directly
import styles from "./menu-bar.css";

// Import saveProject and getSession
import {
    saveProject,
    getSession,
    getProjectMeta,
} from "../../lib/aw3-functions.js";

const TWSaveStatus = ({
    alertsList,
    fileHandle,
    projectChanged,
    showSaveFilePicker,
}) => {
    const [isAuthor, setIsAuthor] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [authorUsername, setAuthorUsername] = useState(null);

    const projectId = window.location.hash.substring(1); // use URL hash as project ID
    const projectTitle = localStorage.getItem("title") || "Untitled Project"; // project name, gonna fix

    // Fetch project author
    useEffect(() => {
        const fetchAuthor = async () => {
            try {
                const username = await getProjectMeta(projectId);
                setAuthorUsername(username);
            } catch (err) {
                console.error("Failed to fetch project author:", err);
            }
        };
        fetchAuthor();
    }, [projectId]);

    useEffect(() => {
        const checkAuthor = async () => {
            if (!authorUsername) return;
            const session = await getSession();
            setIsAuthor(Boolean(session?.username === authorUsername));
        };
        checkAuthor();
    }, [authorUsername]);

    const handleAW3Save = async () => {
        try {
            await saveProject(VM, projectId, projectTitle); // use VM directly
            setStatusMessage("Saved!");
        } catch (err) {
            console.error(err);
            setStatusMessage("Failed To Save!");
        } finally {
            setTimeout(() => setStatusMessage(""), 2500);
        }
    };

    const inlineAlerts = filterInlineAlerts(alertsList);

    if (inlineAlerts.length > 0) {
        return <InlineMessages />;
    }

    if (!projectChanged) return null;

    return (
        <div className={styles.menuBarItemGroup}>
            {/* download project to your device */}
            <SB3Downloader showSaveFilePicker={showSaveFilePicker}>
                {(_className, _downloadProjectCallback, { smartSave }) => (
                    <div
                        onClick={smartSave}
                        className={classNames([
                            styles.menuBarItem,
                            styles.hoverable,
                        ])}
                    >
                        {fileHandle ? (
                            <FormattedMessage
                                defaultMessage="Save as {file}"
                                description="Menu bar item to save project to an existing file on the user's computer"
                                id="tw.menuBar.saveAs"
                                values={{ file: fileHandle.name }}
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Save to your computer"
                                description="Menu bar item for downloading a project to your computer"
                                id="gui.menuBar.downloadToComputer"
                            />
                        )}
                    </div>
                )}
            </SB3Downloader>

            {/* allow project saving */}
            {isAuthor && (
                <div
                    onClick={handleAW3Save}
                    className={classNames([
                        styles.menuBarItem,
                        styles.hoverable,
                    ])}
                >
                    {statusMessage ? (
                        statusMessage
                    ) : (
                        <FormattedMessage
                            defaultMessage="Save Now..."
                            description="Menu bar item for saving project to online server"
                            id="tw.menuBar.saveOnline"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    fileHandle: PropTypes.shape({
        name: PropTypes.string,
    }),
    projectChanged: PropTypes.bool,
    showSaveFilePicker: PropTypes.func,
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    fileHandle: state.scratchGui.tw.fileHandle,
    projectChanged: state.scratchGui.projectChanged,
});

export default connect(mapStateToProps, () => ({}))(TWSaveStatus);
