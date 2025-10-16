import React, { useEffect } from "react";
import GUI from "../containers/gui.jsx";
import initLiveCollab from "../lib/collaboration/liveCollab";

const searchParams = new URLSearchParams(location.search);
const cloudHost = searchParams.get("cloud_host") || "wss://clouddata.turbowarp.org";

const RenderGUI = props => {

    useEffect(() => {
        let stopLiveCollab = null;

        // continuously check for workspace until ready
        const interval = setInterval(() => {
            if (window.vm?.runtime?._blocks?.workspace && !stopLiveCollab) {
                const workspace = window.vm.runtime._blocks.workspace;
                stopLiveCollab = initLiveCollab({
                    workspace: workspace,
                    vm: window.vm,
                    socketUrl: "http://localhost:3000" // replace with your server
                });
                console.log("[liveCollab] started and running forever");
                // do not clear interval; keep checking in case workspace is recreated
            }
        }, 500);

        // cleanup on unmount
        return () => {
            clearInterval(interval);
            if (stopLiveCollab) stopLiveCollab();
        };
    }, []);

    return (
        <GUI
            cloudHost={cloudHost}
            canUseCloud
            hasCloudPermission
            canSave={false}
            basePath={process.env.ROOT}
            canEditTitle
            enableCommunity={!window.isPwa}
            {...props}
        />
    );
};

export default RenderGUI;

