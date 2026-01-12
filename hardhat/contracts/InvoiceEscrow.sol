// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoiceEscrow
 * @author Senior Solidity Developer
 * @notice A decentralized invoice and payment escrow system for freelancers and clients
 * @dev This contract manages invoices, payments, and escrow functionality
 */
contract InvoiceEscrow is Ownable {
    /**
     * @notice Invoice status enumeration
     * @dev CREATED: Invoice created but not yet funded
     * @dev FUNDED: Client has deposited ETH into escrow
     * @dev COMPLETED: Freelancer has marked work as complete
     * @dev PAID: Payment has been released to freelancer
     * @dev CANCELLED: Invoice has been cancelled
     */
    enum InvoiceStatus {
        CREATED,
        FUNDED,
        COMPLETED,
        PAID,
        CANCELLED
    }

    /**
     * @notice Invoice structure containing all invoice details
     * @param invoiceId Unique identifier for the invoice
     * @param client Address of the client who creates and funds the invoice
     * @param freelancer Address of the freelancer who receives payment
     * @param amount Amount of ETH (in wei) for the invoice
     * @param description Description of the work or service
     * @param status Current status of the invoice
     */
    struct Invoice {
        uint256 invoiceId;
        address client;
        address freelancer;
        uint256 amount;
        string description;
        InvoiceStatus status;
    }

    /// @notice Mapping from invoice ID to Invoice struct
    mapping(uint256 => Invoice) public invoices;

    /// @notice Counter for generating unique invoice IDs
    uint256 private _invoiceCounter;

    /// @notice Event emitted when a new invoice is created
    /// @param invoiceId The unique identifier of the invoice
    /// @param client Address of the client
    /// @param freelancer Address of the freelancer
    /// @param amount Amount of ETH (in wei)
    /// @param description Description of the work
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        string description
    );

    /// @notice Event emitted when an invoice is funded with ETH
    /// @param invoiceId The unique identifier of the invoice
    /// @param amount Amount of ETH deposited
    event InvoiceFunded(uint256 indexed invoiceId, uint256 amount);

    /// @notice Event emitted when freelancer marks invoice as completed
    /// @param invoiceId The unique identifier of the invoice
    event InvoiceCompleted(uint256 indexed invoiceId);

    /// @notice Event emitted when payment is released to freelancer
    /// @param invoiceId The unique identifier of the invoice
    /// @param freelancer Address receiving the payment
    /// @param amount Amount of ETH released
    event PaymentReleased(
        uint256 indexed invoiceId,
        address indexed freelancer,
        uint256 amount
    );

    /// @notice Event emitted when an invoice is cancelled
    /// @param invoiceId The unique identifier of the invoice
    event InvoiceCancelled(uint256 indexed invoiceId);

    /// @notice Event emitted when admin resolves a dispute
    /// @param invoiceId The unique identifier of the invoice
    /// @param action The action taken (e.g., "release" or "refund")
    event DisputeResolved(uint256 indexed invoiceId, string action);

    /**
     * @notice Constructor that sets the contract owner
     * @param initialOwner Address that will own the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        _invoiceCounter = 0;
    }

    /**
     * @notice Creates a new invoice
     * @dev Only the client can create an invoice for themselves
     * @param freelancer Address of the freelancer
     * @param amount Amount of ETH (in wei) for the invoice
     * @param description Description of the work or service
     * @return invoiceId The unique identifier of the created invoice
     */
    function createInvoice(
        address freelancer,
        uint256 amount,
        string memory description
    ) external returns (uint256) {
        require(freelancer != address(0), "InvoiceEscrow: invalid freelancer address");
        require(amount > 0, "InvoiceEscrow: amount must be greater than zero");
        require(bytes(description).length > 0, "InvoiceEscrow: description cannot be empty");

        uint256 invoiceId = _invoiceCounter;
        _invoiceCounter++;

        invoices[invoiceId] = Invoice({
            invoiceId: invoiceId,
            client: msg.sender,
            freelancer: freelancer,
            amount: amount,
            description: description,
            status: InvoiceStatus.CREATED
        });

        emit InvoiceCreated(invoiceId, msg.sender, freelancer, amount, description);

        return invoiceId;
    }

    /**
     * @notice Funds an invoice with ETH
     * @dev Only the client who created the invoice can fund it
     * @dev Invoice must be in CREATED status
     * @dev Sent ETH must match the invoice amount exactly
     * @param invoiceId The unique identifier of the invoice
     */
    function fundInvoice(uint256 invoiceId) external payable {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.client != address(0), "InvoiceEscrow: invoice does not exist");
        require(invoice.client == msg.sender, "InvoiceEscrow: only client can fund invoice");
        require(invoice.status == InvoiceStatus.CREATED, "InvoiceEscrow: invoice must be in CREATED status");
        require(msg.value == invoice.amount, "InvoiceEscrow: sent amount must match invoice amount");

        invoice.status = InvoiceStatus.FUNDED;

        emit InvoiceFunded(invoiceId, msg.value);
    }

    /**
     * @notice Marks an invoice as completed
     * @dev Only the freelancer can mark the invoice as completed
     * @dev Invoice must be in FUNDED status
     * @param invoiceId The unique identifier of the invoice
     */
    function markInvoiceCompleted(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.freelancer != address(0), "InvoiceEscrow: invoice does not exist");
        require(invoice.freelancer == msg.sender, "InvoiceEscrow: only freelancer can mark as completed");
        require(invoice.status == InvoiceStatus.FUNDED, "InvoiceEscrow: invoice must be in FUNDED status");

        invoice.status = InvoiceStatus.COMPLETED;

        emit InvoiceCompleted(invoiceId);
    }

    /**
     * @notice Releases payment to the freelancer
     * @dev Only the client can release payment
     * @dev Invoice must be in COMPLETED status
     * @dev Uses checks-effects-interactions pattern to prevent re-entrancy
     * @param invoiceId The unique identifier of the invoice
     */
    function releasePayment(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.client != address(0), "InvoiceEscrow: invoice does not exist");
        require(invoice.client == msg.sender, "InvoiceEscrow: only client can release payment");
        require(invoice.status == InvoiceStatus.COMPLETED, "InvoiceEscrow: invoice must be in COMPLETED status");

        uint256 amount = invoice.amount;
        address freelancer = invoice.freelancer;

        // Checks-Effects-Interactions pattern
        invoice.status = InvoiceStatus.PAID;

        (bool success, ) = freelancer.call{value: amount}("");
        require(success, "InvoiceEscrow: payment transfer failed");

        emit PaymentReleased(invoiceId, freelancer, amount);
    }

    /**
     * @notice Cancels an invoice
     * @dev Only the client can cancel the invoice
     * @dev Invoice must be in CREATED status (not yet funded)
     * @param invoiceId The unique identifier of the invoice
     */
    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.client != address(0), "InvoiceEscrow: invoice does not exist");
        require(invoice.client == msg.sender, "InvoiceEscrow: only client can cancel invoice");
        require(invoice.status == InvoiceStatus.CREATED, "InvoiceEscrow: invoice must be in CREATED status");

        invoice.status = InvoiceStatus.CANCELLED;

        emit InvoiceCancelled(invoiceId);
    }

    /**
     * @notice Admin function to resolve disputes
     * @dev Only the contract owner can resolve disputes
     * @dev Can release payment or refund client based on the action
     * @param invoiceId The unique identifier of the invoice
     * @param releaseToFreelancer If true, releases payment to freelancer; if false, refunds to client
     */
    function resolveDispute(uint256 invoiceId, bool releaseToFreelancer) external onlyOwner {
        Invoice storage invoice = invoices[invoiceId];
        
        require(invoice.client != address(0), "InvoiceEscrow: invoice does not exist");
        require(
            invoice.status == InvoiceStatus.FUNDED || invoice.status == InvoiceStatus.COMPLETED,
            "InvoiceEscrow: invoice must be FUNDED or COMPLETED for dispute resolution"
        );

        uint256 amount = invoice.amount;
        address recipient;

        if (releaseToFreelancer) {
            recipient = invoice.freelancer;
            invoice.status = InvoiceStatus.PAID;
            emit DisputeResolved(invoiceId, "release");
        } else {
            recipient = invoice.client;
            invoice.status = InvoiceStatus.CANCELLED;
            emit DisputeResolved(invoiceId, "refund");
        }

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "InvoiceEscrow: dispute resolution transfer failed");

        if (releaseToFreelancer) {
            emit PaymentReleased(invoiceId, recipient, amount);
        }
    }

    /**
     * @notice Retrieves invoice details
     * @param invoiceId The unique identifier of the invoice
     * @return invoice The complete Invoice struct
     */
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        require(invoices[invoiceId].client != address(0), "InvoiceEscrow: invoice does not exist");
        return invoices[invoiceId];
    }

    /**
     * @notice Retrieves the status of an invoice
     * @param invoiceId The unique identifier of the invoice
     * @return status The current InvoiceStatus of the invoice
     */
    function getInvoiceStatus(uint256 invoiceId) external view returns (InvoiceStatus) {
        require(invoices[invoiceId].client != address(0), "InvoiceEscrow: invoice does not exist");
        return invoices[invoiceId].status;
    }

    /**
     * @notice Returns the total number of invoices created
     * @return The current invoice counter value
     */
    function getTotalInvoices() external view returns (uint256) {
        return _invoiceCounter;
    }

    /**
     * @notice Allows the contract to receive ETH
     * @dev This is necessary for the fundInvoice function to work
     */
    receive() external payable {}
}
