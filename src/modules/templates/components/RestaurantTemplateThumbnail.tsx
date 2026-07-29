export function RestaurantTemplateThumbnail() {
  return (
    <div aria-hidden="true" className="template-thumbnail template-thumbnail-restaurant-premium">
      <div className="template-thumbnail-restaurant-premium-hero">
        <span className="template-thumbnail-restaurant-status">● Aberto agora</span>
        <div className="template-thumbnail-restaurant-premium-brand">
          <span>CASA DO</span>
          <strong>SABOR</strong>
        </div>
        <div className="template-thumbnail-restaurant-premium-copy">
          <strong>Casa do Sabor</strong>
          <span>Pedidos que ficam na memória.</span>
        </div>
      </div>
      <div className="template-thumbnail-restaurant-premium-cta">
        <span>◉ Pedir pelo WhatsApp</span>
        <span>→</span>
      </div>
      <div className="template-thumbnail-restaurant-premium-products">
        {["Prato", "Pizza", "Doce"].map((label) => (
          <div key={label}>
            <span className="template-thumbnail-food" />
            <b>{label}</b>
            <small>R$ 34,90</small>
          </div>
        ))}
      </div>
    </div>
  );
}
