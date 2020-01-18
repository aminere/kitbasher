import * as spider from "../../spider-engine/src/assets/model/Model";
import { ModelElement } from "../../spider-engine/src/assets/model/ModelElement";
import { Entity, EntityInternal } from "../../spider-engine/src/core/Entity";
import { Transform } from "../../spider-engine/src/core/Transform";
import { SkinnedMesh } from "../../spider-engine/src/graphics/geometry/SkinnedMesh";
import { StaticMesh } from "../../spider-engine/src/graphics/geometry/StaticMesh";
import { ModelMesh } from "../../spider-engine/src/assets/model/ModelMesh";
import { Visual } from "../../spider-engine/src/graphics/Visual";
import { ModelSkinnedMesh } from "../../spider-engine/src/assets/model/ModelSkinnedMesh";
import { StaticMeshAsset } from "../../spider-engine/src/assets/StaticMeshAsset";
import { IObjectManagerInternal } from "../../spider-engine/src/core/IObjectManager";
import { Material } from "../../spider-engine/src/graphics/Material";
import { ModelMultiMesh } from "../../spider-engine/src/assets/model/ModelMultiMesh";
import { ModelBone } from "../../spider-engine/src/assets/model/ModelBone";
import { SerializableMatrix44 } from "../../spider-engine/src/math/Matrix44";
import { Bone } from "../../spider-engine/src/core/Bone";
import { AnimationComponent } from "../../spider-engine/src/animation/AnimationComponent";
import { AnimationInstance } from "../../spider-engine/src/animation/AnimationInstance";
import * as spiderAnimation from "../../spider-engine/src/animation/Animation";
import { ScenesInternal } from "../../spider-engine/src/core/Scenes";

namespace Private {
    export function loadElement(element: ModelElement) {
        const childPromises: Array<Promise<void>> = [];
        const instance = new Entity();
        instance.name = element.name;
        EntityInternal.setComponentFromInstance(instance, element.transform.copy() as Transform);

        // ModelMesh
        if (element.isA(ModelMesh)) {
            const meshElement = element as ModelMesh;
            const visual = new Visual();
            EntityInternal.setComponentFromInstance(instance, visual);
            const isSkinned = element.isA(ModelSkinnedMesh);

            // Assign geometry
            const geometry = isSkinned ? new SkinnedMesh() : new StaticMesh();
            visual.geometry = geometry;
            if (isSkinned) {
                const skinnedMesh = geometry as SkinnedMesh;
                const modelSkinnedMesh = (element as ModelSkinnedMesh);
                skinnedMesh.bindMatrix = modelSkinnedMesh.bindMatrix;
                skinnedMesh.boneFbxIds = modelSkinnedMesh.boneFbxIds;
            }

            if (meshElement.mesh.asset) {
                geometry.mesh = meshElement.mesh.asset;
            } else if (meshElement.mesh.id) {
                childPromises.push(
                    IObjectManagerInternal.instance.loadObject(meshElement.mesh.id).then(([meshAsset]) => {
                        geometry.mesh = meshAsset as StaticMeshAsset;
                    })
                );
            }

            // Assign material
            if (meshElement.material.id) {
                childPromises.push(
                    IObjectManagerInternal.instance.loadObject(meshElement.material.id).then(([meshMaterial]) => {
                        visual.material = meshMaterial as Material;
                    })
                );
            }

            // ModelMultiMesh
        } else if (element.isA(ModelMultiMesh)) {

            const multiMesh = element as ModelMultiMesh;
            multiMesh.subMeshes.data.forEach((subMesh, index) => {
                const { geometry, material } = subMesh;
                const subMeshEntity = new Entity().setComponent(Transform);
                subMeshEntity.name = `${instance.name}_${index}`;
                instance.addChild(subMeshEntity);

                const visual = new Visual();
                EntityInternal.setComponentFromInstance(subMeshEntity, visual);

                // Assign geometry
                const staticMesh = new StaticMesh();
                visual.geometry = staticMesh;
                if (geometry.asset) {
                    staticMesh.mesh = geometry.asset;
                } else if (geometry.id) {
                    childPromises.push(
                        IObjectManagerInternal.instance.loadObject(geometry.id).then(([meshAsset]) => {
                            staticMesh.mesh = meshAsset as StaticMeshAsset;
                        })
                    );
                }

                // Assign material
                if (material.id) {
                    childPromises.push(
                        IObjectManagerInternal.instance.loadObject(material.id).then(([meshMaterial]) => {
                            visual.material = meshMaterial as Material;
                        })
                    );
                }
            });

        } else if (element.isA(ModelBone)) {
            const boneElement = element as ModelBone;
            instance.setComponent(Bone, {
                worldMatrix: new SerializableMatrix44().copy(boneElement.worldMatrix),
                inverseMatrix: new SerializableMatrix44().getInverse(boneElement.worldMatrix),
                fbxId: boneElement.fbxNodeId
            });
        }

        // recurse through children
        for (const elementRef of element.children.data) {
            if (elementRef.instance) {
                childPromises.push(
                    loadElement(elementRef.instance).then(subElement => {
                        instance.addChild(subElement);
                    })
                );
            }
        }

        return new Promise<Entity>((resolve, reject) => {
            Promise.all(childPromises)
                .then(() => resolve(instance))
                .catch(() => resolve(instance));
        });
    }
}

export class Model {
    public static instantiate(model: spider.Model) {
        const elements = model.elements.data.map(_r => _r.instance as ModelElement);
        const multipleElements = elements.length > 1;
        const modelParent = multipleElements ? new Entity().setComponent(Transform) : null;
        let elementParent: Entity | null = null;
        return Promise.all(elements.map(e => Private.loadElement(e)))
            .then(instances => {
                for (const instance of instances) {
                    if (modelParent) {
                        modelParent.addChild(instance);

                        // initialize some more references within the model
                        const visual = instance.getComponent(Visual);
                        const geometry = visual ? visual.geometry : undefined;
                        if (geometry && geometry.isA(SkinnedMesh)) {
                            // attempt to reference the skeleton                      
                            (geometry as SkinnedMesh).skeleton = modelParent;
                        }

                    } else {
                        // tslint:disable-next-line
                        console.assert(model.elements.data.length === 1);
                        elementParent = instance;
                    }
                }

                const animationLoaders: Array<Promise<void>> = [];
                let entity: Entity | null = null;
                if (modelParent) {
                    modelParent.transform.scale.multiply(model.fbxScaleFactor);
                    modelParent.transform.position.multiply(model.fbxScaleFactor);
                    modelParent.name = model.name;

                    // if animations are present in the model, add them to the root
                    const animationRefs = model.animationRefs.data.filter(r => Boolean(r.id));
                    if (animationRefs.length > 0) {
                        const animationComponent = new AnimationComponent();
                        EntityInternal.setComponentFromInstance(modelParent, animationComponent);
                        for (const animationRef of animationRefs) {
                            const instance = new AnimationInstance();
                            animationComponent.animations.push(instance);
                            if (animationRef.asset) {
                                instance.animation = animationRef.asset;
                            } else {
                                animationLoaders.push(new Promise((resolve, reject) => {
                                    IObjectManagerInternal.instance.loadObject(animationRef.id as string)
                                        .then(([animation]) => {
                                            instance.animation = animation as spiderAnimation.Animation;
                                            resolve();
                                        })
                                        .catch(e => {
                                            // TODO log warning?
                                            resolve();
                                        });
                                }));
                            }
                        }
                    }
                    entity = modelParent;

                } else if (elementParent) {
                    elementParent.name = model.name;
                    elementParent.transform.scale.multiply(model.fbxScaleFactor);
                    elementParent.transform.position.multiply(model.fbxScaleFactor);
                    entity = elementParent;
                }

                return Promise.all(animationLoaders).then(() => {
                    ScenesInternal.list()[0].root.addChild(entity as Entity);
                    return entity as Entity;
                });
            });
    }
}
