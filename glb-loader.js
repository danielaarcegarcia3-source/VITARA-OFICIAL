/**
 * glb-loader.js — cargador glTF/GLB mínimo para VITARA
 * -------------------------------------------------------------------------
 * Carga modelos .glb sin dependencias externas (además de Three.js), con
 * geometrías, jerarquía de nodos, materiales PBR y texturas embebidas.
 * También incluye un orbitador táctil/ratón accesible y utilidades de encuadre.
 *
 * Uso:
 *   const { group } = await VitaraGLB.load('assets/3d/adn.glb');
 *   const fitted = VitaraGLB.fitToHeight(group, 9);
 *   const orbit = VitaraGLB.orbit(fitted, canvas, { autoRotate: true });
 */
(function () {
  'use strict';

  const COMPONENTES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  };
  const TAMANOS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

  function leerChunks(buffer) {
    const vista = new DataView(buffer);
    if (vista.getUint32(0, true) !== 0x46546c67) throw new Error('El archivo no es un GLB válido.');
    const version = vista.getUint32(4, true);
    if (version !== 2) throw new Error('Solo se admite glTF 2.0.');
    let offset = 12;
    let json = null;
    let bin = new Uint8Array(0);
    while (offset < buffer.byteLength) {
      const largo = vista.getUint32(offset, true);
      const tipo = vista.getUint32(offset + 4, true);
      const datos = new Uint8Array(buffer, offset + 8, largo);
      if (tipo === 0x4e4f534a) json = JSON.parse(new TextDecoder('utf-8').decode(datos));
      else if (tipo === 0x004e4942) bin = datos;
      offset += 8 + largo + ((4 - (largo % 4)) % 4);
      // El padding ya está incluido en el largo del chunk; el extra solo aplica
      // a algunos exportadores. Evitamos saltar de más si el offset ya cuadra.
      if (offset % 4 !== 0) offset += 4 - (offset % 4);
    }
    if (!json) throw new Error('El GLB no contiene el bloque JSON.');
    return { json, bin };
  }

  class Parser {
    constructor(json, bin) {
      this.json = json;
      this.bin = bin;
      this.materiales = new Map();
      this.texturas = new Map();
    }

    bufferView(indice) {
      return this.json.bufferViews[indice];
    }

    accesor(indice) {
      const acc = this.json.accessors[indice];
      const num = TAMANOS[acc.type];
      const Tipo = COMPONENTES[acc.componentType];
      const bv = acc.bufferView != null ? this.bufferView(acc.bufferView) : null;
      const cantidad = acc.count * num;
      const salida = new Tipo(cantidad);
      if (!bv) return { array: salida, itemSize: num, count: acc.count, normalized: !!acc.normalized };
      const bytesElemento = Tipo.BYTES_PER_ELEMENT;
      const stride = bv.byteStride || bytesElemento * num;
      const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
      const dv = new DataView(this.bin.buffer, this.bin.byteOffset + base, Math.min(bv.byteLength, this.bin.byteLength - base));
      if (stride === bytesElemento * num && base % bytesElemento === 0) {
        const directo = new Tipo(this.bin.buffer, this.bin.byteOffset + base, cantidad);
        salida.set(directo);
      } else {
        let p = 0;
        for (let i = 0; i < acc.count; i++) {
          for (let k = 0; k < num; k++) {
            const off = i * stride + k * bytesElemento;
            if (acc.componentType === 5126) salida[p++] = dv.getFloat32(off, true);
            else if (acc.componentType === 5125) salida[p++] = dv.getUint32(off, true);
            else if (acc.componentType === 5123) salida[p++] = dv.getUint16(off, true);
            else if (acc.componentType === 5122) salida[p++] = dv.getInt16(off, true);
            else if (acc.componentType === 5121) salida[p++] = dv.getUint8(off);
            else salida[p++] = dv.getInt8(off);
          }
        }
      }
      return { array: salida, itemSize: num, count: acc.count, normalized: !!acc.normalized };
    }

    async textura(indice) {
      if (this.texturas.has(indice)) return this.texturas.get(indice);
      const promesa = (async () => {
        const def = this.json.textures[indice];
        const img = this.json.images[def.source];
        let url = img.uri;
        if (!url) {
          const bv = this.bufferView(img.bufferView);
          const bytes = this.bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
          url = URL.createObjectURL(new Blob([bytes], { type: img.mimeType || 'image/png' }));
        }
        const tex = await new THREE.TextureLoader().loadAsync(url);
        tex.flipY = false;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.needsUpdate = true;
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        return tex;
      })();
      this.texturas.set(indice, promesa);
      return promesa;
    }

    async material(indice) {
      if (indice == null) return new THREE.MeshStandardMaterial({ color: 0xcfdad5, roughness: 0.55, metalness: 0.08 });
      if (this.materiales.has(indice)) return this.materiales.get(indice);
      const promesa = (async () => {
        const def = this.json.materials[indice];
        const pbr = def.pbrMetallicRoughness || {};
        const esUnlit = def.extensions && def.extensions.KHR_materials_unlit;
        const mat = esUnlit
          ? new THREE.MeshBasicMaterial({ color: 0xffffff })
          : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: pbr.roughnessFactor != null ? pbr.roughnessFactor : 0.55, metalness: pbr.metallicFactor != null ? pbr.metallicFactor : 0.05 });
        if (pbr.baseColorFactor) mat.color.fromArray(pbr.baseColorFactor.slice(0, 3));
        if (pbr.baseColorTexture) mat.map = await this.textura(pbr.baseColorTexture.index);
        if (def.emissiveFactor) {
          mat.emissive = new THREE.Color().fromArray(def.emissiveFactor.slice(0, 3));
          mat.emissiveIntensity = 1;
        }
        if (def.alphaMode === 'BLEND') { mat.transparent = true; mat.depthWrite = false; }
        if (def.alphaMode === 'MASK') { mat.alphaTest = def.alphaCutoff != null ? def.alphaCutoff : 0.5; }
        mat.side = def.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        return mat;
      })();
      this.materiales.set(indice, promesa);
      return promesa;
    }

    geometria(prim) {
      const geo = new THREE.BufferGeometry();
      const attrs = prim.attributes || {};
      const nombres = { POSITION: 'position', NORMAL: 'normal', TEXCOORD_0: 'uv', TEXCOORD_1: 'uv2', COLOR_0: 'color', JOINTS_0: 'skinIndex', WEIGHTS_0: 'skinWeight' };
      Object.keys(attrs).forEach((clave) => {
        const destino = nombres[clave];
        if (!destino) return;
        const a = this.accesor(attrs[clave]);
        geo.setAttribute(destino, new THREE.BufferAttribute(a.array, a.itemSize, a.normalized));
      });
      if (prim.indices != null) {
        const a = this.accesor(prim.indices);
        geo.setIndex(new THREE.BufferAttribute(a.array, 1));
      }
      if (!geo.getAttribute('normal')) geo.computeVertexNormals();
      return geo;
    }

    async nodo(indice) {
      const def = this.json.nodes[indice];
      const obj = new THREE.Group();
      obj.name = def.name || `nodo-${indice}`;
      if (def.matrix) obj.applyMatrix4(new THREE.Matrix4().fromArray(def.matrix));
      else {
        if (def.translation) obj.position.fromArray(def.translation);
        if (def.rotation) obj.quaternion.fromArray(def.rotation);
        if (def.scale) obj.scale.fromArray(def.scale);
      }
      if (def.mesh != null) {
        const malla = this.json.meshes[def.mesh];
        const partes = await Promise.all((malla.primitives || []).map(async (prim, i) => {
          const geo = this.geometria(prim);
          const mat = await this.material(prim.material);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.name = `${malla.name || obj.name} · parte ${i + 1}`;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          return mesh;
        }));
        partes.forEach((p) => obj.add(p));
      }
      if (def.children) {
        const hijos = await Promise.all(def.children.map((c) => this.nodo(c)));
        hijos.forEach((h) => obj.add(h));
      }
      return obj;
    }

    async construir() {
      const raiz = new THREE.Group();
      raiz.name = 'GLB';
      const escenas = this.json.scenes || [];
      const escena = escenas[this.json.scene || 0] || escenas[0];
      const nodos = escena && escena.nodes ? escena.nodes : (this.json.nodes || []).map((_, i) => i);
      const hijos = await Promise.all(nodos.map((n) => this.nodo(n)));
      hijos.forEach((h) => raiz.add(h));
      return raiz;
    }
  }

  async function load(url) {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
    const buffer = await res.arrayBuffer();
    const { json, bin } = leerChunks(buffer);
    const parser = new Parser(json, bin);
    const group = await parser.construir();
    group.userData.glb = {
      url,
      asset: json.asset || {},
      meshes: (json.meshes || []).length,
      materials: (json.materials || []).length,
      animations: (json.animations || []).length
    };
    return { group, json };
  }

  /**
   * Orienta el eje más largo del modelo en vertical (Y), lo centra y lo escala.
   * Devuelve un grupo contenedor con la transformación aplicada.
   */
  function fitToHeight(group, altura, opciones = {}) {
    const contenedor = new THREE.Group();
    contenedor.name = 'modelo-encuadrado';
    contenedor.add(group);

    if (opciones.orientar !== false) {
      const caja = new THREE.Box3().setFromObject(group);
      const tam = caja.getSize(new THREE.Vector3());
      if (tam.x >= tam.y && tam.x >= tam.z) group.rotation.z = Math.PI / 2;
      else if (tam.z >= tam.y && tam.z >= tam.x) group.rotation.x = -Math.PI / 2;
    }

    contenedor.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(contenedor);
    const centro = caja.getCenter(new THREE.Vector3());
    const tam = caja.getSize(new THREE.Vector3());
    group.position.sub(centro);
    contenedor.scale.setScalar(altura / Math.max(tam.y, 0.0001));
    contenedor.updateMatrixWorld(true);
    return contenedor;
  }

  function dispose(obj) {
    obj.traverse((n) => {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        const mats = Array.isArray(n.material) ? n.material : [n.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  /**
   * Rotación y zoom suaves, ratón + táctil + teclado.
   * No usa OrbitControls: cero dependencias y control total del gesto.
   */
  function orbit(objeto, canvas, opciones = {}) {
    const estado = {
      rotX: opciones.rotX || 0,
      rotY: opciones.rotY || 0,
      zoom: opciones.zoom || 1,
      autoRotate: opciones.autoRotate !== false,
      arrastrando: false,
      x: 0,
      y: 0,
      punteros: new Map(),
      distanciaPinza: 0
    };
    const baseX = objeto.rotation.x;
    const baseY = objeto.rotation.y;
    const camara = opciones.camera;
    const zBase = camara ? camara.position.z : 0;
    let despierto = false;
    let frame = 0;

    function aplicar() {
      objeto.rotation.x = baseX + estado.rotX;
      objeto.rotation.y = baseY + estado.rotY;
      if (camara) {
        camara.position.z = zBase / estado.zoom;
        camara.lookAt(0, 0.4, 0);
      }
    }

    function animar() {
      if (!despierto) return;
      if (estado.autoRotate && !estado.arrastrando && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        estado.rotY += 0.0018;
      }
      aplicar();
      frame = requestAnimationFrame(animar);
    }

    function despertar() {
      if (despierto) return;
      despierto = true;
      animar();
    }

    canvas.addEventListener('pointerdown', (e) => {
      estado.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (estado.punteros.size === 1) {
        estado.arrastrando = true;
        estado.x = e.clientX;
        estado.y = e.clientY;
        canvas.setPointerCapture?.(e.pointerId);
      } else if (estado.punteros.size === 2) {
        const [a, b] = [...estado.punteros.values()];
        estado.distanciaPinza = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!estado.punteros.has(e.pointerId)) return;
      estado.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (estado.punteros.size === 1 && estado.arrastrando) {
        const dx = e.clientX - estado.x;
        const dy = e.clientY - estado.y;
        estado.rotY += dx * 0.0055;
        estado.rotX = Math.max(-0.8, Math.min(0.8, estado.rotX + dy * 0.004));
        estado.x = e.clientX;
        estado.y = e.clientY;
        aplicar();
      } else if (estado.punteros.size === 2) {
        const [a, b] = [...estado.punteros.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (estado.distanciaPinza) {
          estado.zoom = Math.max(0.62, Math.min(1.9, estado.zoom * (dist / estado.distanciaPinza)));
          aplicar();
        }
        estado.distanciaPinza = dist;
      }
    });
    const soltar = (e) => {
      estado.punteros.delete(e.pointerId);
      if (estado.punteros.size === 0) estado.arrastrando = false;
      if (estado.punteros.size < 2) estado.distanciaPinza = 0;
    };
    canvas.addEventListener('pointerup', soltar);
    canvas.addEventListener('pointercancel', soltar);
    canvas.addEventListener('pointerleave', (e) => { if (e.buttons === 0) soltar(e); });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      estado.zoom = Math.max(0.62, Math.min(1.9, estado.zoom * (e.deltaY > 0 ? 0.94 : 1.06)));
      aplicar();
    }, { passive: false });
    canvas.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { estado.rotY -= 0.12; aplicar(); }
      if (e.key === 'ArrowRight') { estado.rotY += 0.12; aplicar(); }
      if (e.key === 'ArrowUp') { estado.rotX = Math.max(-0.8, estado.rotX - 0.08); aplicar(); }
      if (e.key === 'ArrowDown') { estado.rotX = Math.min(0.8, estado.rotX + 0.08); aplicar(); }
      if (e.key === '+' || e.key === '=') { estado.zoom = Math.min(1.9, estado.zoom * 1.08); aplicar(); }
      if (e.key === '-') { estado.zoom = Math.max(0.62, estado.zoom / 1.08); aplicar(); }
    });
    canvas.tabIndex = 0;
    despertar();
    aplicar();

    return {
      despertar,
      estado,
      reencuadrar() { estado.rotX = opciones.rotX || 0; estado.rotY = opciones.rotY || 0; estado.zoom = opciones.zoom || 1; aplicar(); },
      zoom(factor) { estado.zoom = Math.max(0.62, Math.min(1.9, estado.zoom * factor)); aplicar(); },
      setAutoRotate(v) { estado.autoRotate = !!v; },
      dispose() { despierto = false; cancelAnimationFrame(frame); }
    };
  }

  window.VitaraGLB = { load, fitToHeight, orbit, dispose };
})();
