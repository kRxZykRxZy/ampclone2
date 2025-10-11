import React, { useEffect } from "react";
import GUI from "../containers/gui.jsx";

const searchParams = new URLSearchParams(location.search);
const cloudHost =
    searchParams.get("cloud_host") || "wss://clouddata.turbowarp.org";
const creatingNewProject = searchParams.get('new_project') === '1';


const RenderGUI = props => {
    return (
        <GUI
            cloudHost={cloudHost}
            canUseCloud
            canShare={false} // Just Share From The Project Page
            hasCloudPermission
            canSave={true}
            basePath={process.env.ROOT}
            canEditTitle
            enableCommunity={true}
            {...props}
        />
    );
};

export default RenderGUI;
