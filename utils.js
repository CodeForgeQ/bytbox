// utils.js - Common helpers + file system navigation

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
  
  function randomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else el.className += ' ' + className;
  }
  
  function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
  
  // ========== FILESYSTEM HELPERS ==========
  
  /**
   * Resolve a path string relative to current directory.
   * @param {string} rawPath - e.g., '~/projects/../file'
   * @param {string[]} currentDir - current dir array, e.g., ['~', 'home', 'user']
   * @returns {string[]} resolved path array (always starts with '~')
   */
  function resolvePath(rawPath, currentDir) {
    if (!rawPath) return currentDir.slice();
    let parts = rawPath.replace(/\\/g, '/').split('/').filter(p => p !== '');
    let result;
    if (rawPath.startsWith('/') || rawPath.startsWith('~')) {
      result = ['~'];
      if (rawPath.startsWith('/')) parts = parts.slice(1); // absolute path
    } else {
      result = currentDir.slice();
    }
    for (let part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        if (result.length > 1) result.pop();
      } else {
        result.push(part);
      }
    }
    return result;
  }
  
  /**
   * Traverse the filesystem tree starting from the root node.
   * @param {object} rootNode - the root directory node (FS['~'])
   * @param {string[]} pathArr - resolved path array (['~', ...])
   * @returns {object|null} node at path or null
   */
  function getNodeAtPath(rootNode, pathArr) {
    let node = rootNode;
    // start from 1 because index 0 is '~' (already at root)
    for (let i = 1; i < pathArr.length; i++) {
      if (!node || node.type !== 'dir' || !node.children) return null;
      const child = node.children[pathArr[i]];
      if (!child) return null;
      node = child;
    }
    return node;
  }
  
  /**
   * Get parent node and final name for creation operations.
   * @param {object} rootNode - the root directory node
   * @param {string[]} pathArr - resolved path array
   * @returns {{ parent: object, name: string } | null}
   */
  function getParentAndName(rootNode, pathArr) {
    if (pathArr.length < 2) return null; // cannot create at root
    const parentPath = pathArr.slice(0, -1);
    const parent = getNodeAtPath(rootNode, parentPath);
    if (!parent || parent.type !== 'dir') return null;
    return { parent, name: pathArr[pathArr.length - 1] };
  }
  
  /**
   * Convert path array to display string.
   * @param {string[]} pathArr
   * @returns {string}
   */
  function pathToString(pathArr) {
    if (pathArr.length === 1 && pathArr[0] === '~') return '~';
    return pathArr.join('/').replace('~/', '~/'); // keeps '~/' prefix
  }