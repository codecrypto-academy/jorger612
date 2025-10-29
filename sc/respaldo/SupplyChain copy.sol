// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SupplyChain
 * @dev Contrato para rastrear eventos de productos en la cadena de suministro
 * @author Sistema de Trazabilidad
 */
contract SupplyChain {

    // Estructura para almacenar información de eventos
    struct Event {
        address organization;  // Dirección de la organización que registra el evento
        uint256 timestamp;     // Timestamp del evento
        bytes signature;       // Firma digital del evento
    }

    // Mapeo para almacenar eventos por etiqueta del producto
    mapping(string => Event[]) private events;

    // Evento emitido cuando se añade un nuevo evento
    event EventAdded(string indexed label, address indexed organization, uint256 timestamp);

    /**
     * @dev Añade un evento individual para una etiqueta de producto
     * @param label Etiqueta identificadora del producto
     * @param timestamp Timestamp del evento
     * @param signature Firma digital del evento
     */
    function addEvent(
        string memory label,
        uint256 timestamp,
        bytes memory signature
    ) public {
        require(bytes(label).length > 0, "Label cannot be empty");
        require(timestamp > 0, "Invalid timestamp");
        require(signature.length > 0, "Signature cannot be empty");

        events[label].push(Event({
            organization: msg.sender,
            timestamp: timestamp,
            signature: signature
        }));

        emit EventAdded(label, msg.sender, timestamp);
    }

    /**
     * @dev Añade múltiples eventos para una etiqueta de producto
     * @param labels Array de etiquetas de productos
     * @param timestamp Timestamp del evento
     * @param signature Firma digital del evento
     */
    function addEvents(
        string[] memory labels,
        uint256 timestamp,
        bytes memory signature
    ) public {
        require(labels.length > 0, "Labels array cannot be empty");
        require(timestamp > 0, "Invalid timestamp");
        require(signature.length > 0, "Signature cannot be empty");

        for (uint256 i = 0; i < labels.length; i++) {
            require(bytes(labels[i]).length > 0, "Label cannot be empty");

            events[labels[i]].push(Event({
                organization: msg.sender,
                timestamp: timestamp,
                signature: signature
            }));

            emit EventAdded(labels[i], msg.sender, timestamp);
        }
    }

    /**
     * @dev Obtiene todos los eventos asociados a una etiqueta de producto
     * @param label Etiqueta del producto
     * @return Array de eventos para la etiqueta especificada
     */
    function getEvents(string memory label)
        public
        view
        returns (Event[] memory)
    {
        return events[label];
    }

    /**
     * @dev Obtiene el número total de eventos para una etiqueta
     * @param label Etiqueta del producto
     * @return Número de eventos
     */
    function getEventCount(string memory label) public view returns (uint256) {
        return events[label].length;
    }

    /**
     * @dev Obtiene información de un evento específico
     * @param label Etiqueta del producto
     * @param index Índice del evento
     * @return organization Dirección de la organización
     * @return timestamp Timestamp del evento
     * @return signature Firma del evento
     */
    function getEvent(
        string memory label,
        uint256 index
    )
        public
        view
        returns (
            address organization,
            uint256 timestamp,
            bytes memory signature
        )
    {
        require(index < events[label].length, "Event index out of bounds");

        Event storage eventData = events[label][index];
        return (
            eventData.organization,
            eventData.timestamp,
            eventData.signature
        );
    }
}
