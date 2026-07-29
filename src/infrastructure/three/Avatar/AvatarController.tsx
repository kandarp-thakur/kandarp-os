"use client";

import { memo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface AvatarControllerProps {
    enableBloom?: boolean;
}

function AvatarControllerImpl({ enableBloom = true }: AvatarControllerProps) {
    const { gl, scene } = useThree();

    useEffect(() => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = enableBloom ? 1.05 : 1;
        scene.background = null;
    }, [enableBloom, gl, scene]);

    return null;
}

export const AvatarController = memo(AvatarControllerImpl);
AvatarController.displayName = "AvatarController";
