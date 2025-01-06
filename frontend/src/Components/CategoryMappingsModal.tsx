/**
 *    calling code:
      <CategoryMappingsModal
        category={expandedCategory}
        show={expandedCategory}
        mappings={mappings.filter(({ category }) => category === expandedCategory)[0].descriptions}
      />
 */

import { ButtonGroup, Modal, Button } from "react-bootstrap"
import { CategoryMappingDescription } from "../api"


interface CategoryMappingsModalProps {
  closeModal: () => void
  show: boolean
  mappings: CategoryMappingDescription[]
  deleteMapping: (sk: string) => Promise<void>
}


export function CategoryMappingsModal({
  show,
  closeModal,
  mappings,
  deleteMapping,
}: CategoryMappingsModalProps) {
  return (
    <Modal show={show} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>Related Activities</Modal.Title>
      </Modal.Header>
      <Modal.Body className="flex flex-col">
        {mappings.map((mapping) => {
          return (
            <div key={mapping.sk} className="flex flex-row justify-between">
              <div>
                {mapping.description}
              </div>
              <ButtonGroup>
                <Button onClick={() => deleteMapping(mapping.sk)}>
                  Delete
                </Button>
              </ButtonGroup>
            </div>
          )
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={closeModal}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}