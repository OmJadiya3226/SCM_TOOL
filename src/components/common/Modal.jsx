import { createPortal } from 'react-dom'

const Modal = ({ children }) => {
    return createPortal(children, document.body)
}

export default Modal
